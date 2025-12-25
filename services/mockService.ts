
import { Issue, TaskStatus, User, Role, MediaItem, WardRegistration, RegistrationStatus, BonusRequest, BonusStatus } from '../types';
import { getAreaConfig } from '../constants';
import { dataStore } from '../storage/store';
import { getApiUrl } from './apiConfig';

class MockService {
  private currentUser: User | null = null;

  constructor() {
    this.restoreSession();
  }

  private async restoreSession() {
      try {
          const savedEmail = localStorage.getItem('pc06_last_session_email');
          if (savedEmail) {
              const store = await dataStore.getStore();
              const user = Object.values(store.users).find(u => u.email.toLowerCase() === savedEmail.toLowerCase());
              if (user) {
                  this.currentUser = user;
                  this.pullFromCloud().catch(console.warn);
              }
          }
      } catch (e) {
          console.error("Session restore failed", e);
      }
  }

  async login(email: string) {
    const store = await dataStore.getStore();
    const searchEmail = email.trim().toLowerCase();
    const user = Object.values(store.users).find(u => u.email.toLowerCase() === searchEmail);
    return { success: !!user, requires2FA: !!user };
  }

  async verifyOTP(email: string, otp: string) {
    if (otp === '123456') {
      const store = await dataStore.getStore();
      const searchEmail = email.trim().toLowerCase();
      const user = Object.values(store.users).find(u => u.email.toLowerCase() === searchEmail);
      if (user) {
          this.currentUser = user;
          localStorage.setItem('pc06_last_session_email', user.email);
          await this.pullFromCloud().catch(console.warn);
      }
      return user || null;
    }
    return null;
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('pc06_last_session_email');
  }

  getCurrentUser() { return this.currentUser; }

  private async cloudFetch(params: any) {
      try {
          const baseUrl = getApiUrl();
          if (!baseUrl || baseUrl.length < 20) return { ok: false };

          if (params.action === "getAllData" || params.action === "ping") {
              const queryUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}action=${params.action}&cb=${Date.now()}`;
              const res = await fetch(queryUrl, { method: 'GET', redirect: 'follow' });
              if (!res.ok) return { ok: false };
              return await res.json();
          }

          await fetch(baseUrl, {
              method: 'POST',
              mode: 'no-cors',
              headers: { 'Content-Type': 'text/plain' },
              body: JSON.stringify(params),
          });

          return { ok: true };
      } catch (e: any) {
          return { ok: false, error: e.message };
      }
  }

  async testApiConnection() {
      return await this.cloudFetch({ action: "ping" });
  }

  async pullFromCloud() {
      try {
          const result = await this.cloudFetch({ action: "getAllData" });
          if (result && result.ok && result.data) {
              const store = await dataStore.getStore();
              const cloudData = result.data;

              if (cloudData.issues) {
                  Object.keys(cloudData.issues).forEach(id => {
                      store.issues[id] = cloudData.issues[id];
                  });
              }
              if (cloudData.registrations) {
                  Object.keys(cloudData.registrations).forEach(id => {
                      store.registrations[id] = cloudData.registrations[id];
                  });
              }
              if (cloudData.bonusRequests) {
                  Object.keys(cloudData.bonusRequests).forEach(id => {
                      store.bonusRequests[id] = cloudData.bonusRequests[id];
                  });
              }

              await dataStore.save(store);
              return { success: true, count: Object.keys(cloudData.issues || {}).length };
          }
      } catch (e) {
          console.error("Cloud pull failed", e);
      }
      return { success: false };
  }

  async createIssue(data: any, operator: string) {
      const store = await dataStore.getStore();
      const newIssue: Issue = {
          id: `TASK_${Date.now()}`,
          createdTime: new Date().toISOString(),
          deadlineTime: new Date(Date.now() + 45*60000).toISOString(),
          wardId: data.wardId,
          wardName: data.wardName,
          locationDescription: data.locationDescription,
          violationCode: data.violationCode,
          penaltyPoints: 1,
          source: data.source,
          imageBeforePath: '',
          evidence: data.evidence || [],
          reportEvidence: [],
          status: TaskStatus.NEW,
          versions: []
      };
      
      store.issues[newIssue.id] = newIssue;
      await dataStore.save(store);
      this.cloudFetch({ action: "createIssue", payload: newIssue }).catch(console.warn);
      return newIssue;
  }

  async updateIssue(id: string, updates: any, reason: string, operator: string) {
      const store = await dataStore.getStore();
      const issue = store.issues[id];
      if (issue) {
          Object.assign(issue, updates);
          await dataStore.save(store);
          this.cloudFetch({ action: "updateIssue", id, payload: issue }).catch(console.warn);
      }
      return issue;
  }

  async getIssues() {
      const store = await dataStore.getStore();
      return Object.values(store.issues).sort((a,b) => b.id.localeCompare(a.id));
  }
  
  async getIssueById(id: string) {
      const store = await dataStore.getStore();
      return store.issues[id];
  }

  async getRegistrations(wardId?: string) {
      const store = await dataStore.getStore();
      const regs = Object.values(store.registrations);
      return wardId ? regs.filter(r => r.wardId === wardId) : regs;
  }

  async getBonusRequests(wardId?: string) {
      const store = await dataStore.getStore();
      const bonus = Object.values(store.bonusRequests);
      return wardId ? bonus.filter(b => b.wardId === wardId) : bonus;
  }

  async submitRegistration(points: number, month: string) {
      if (!this.currentUser) return null;
      const store = await dataStore.getStore();
      const config = getAreaConfig(points);
      const newReg: WardRegistration = {
          id: `REG_${Date.now()}`,
          wardId: this.currentUser.id,
          wardName: this.currentUser.unitName,
          month: month,
          points: points,
          proposedCoefficient: config.coefficient as 1|2|3|4,
          status: RegistrationStatus.PENDING,
          createdAt: new Date().toISOString()
      };
      store.registrations[newReg.id] = newReg;
      await dataStore.save(store);
      this.cloudFetch({ action: "submitRegistration", payload: newReg }).catch(console.warn);
      return newReg;
  }

  async reviewRegistration(id: string, action: 'APPROVE' | 'REJECT', note: string) {
      const store = await dataStore.getStore();
      const reg = store.registrations[id];
      if (reg) {
          reg.status = action === 'APPROVE' ? RegistrationStatus.APPROVED : RegistrationStatus.REJECTED;
          reg.note = note;
          reg.approvedAt = new Date().toISOString();
          await dataStore.save(store);
          this.cloudFetch({ action: "reviewRegistration", id, payload: { id, status: reg.status } }).catch(console.warn);
      }
      return reg;
  }

  async reviewBonusRequest(id: string, action: 'APPROVE' | 'REJECT', note: string) {
      const store = await dataStore.getStore();
      const bonus = store.bonusRequests[id];
      if (bonus) {
          bonus.status = action === 'APPROVE' ? BonusStatus.APPROVED : BonusStatus.REJECTED;
          bonus.reviewerNote = note;
          bonus.reviewedAt = new Date().toISOString();
          if (action === 'APPROVE') bonus.finalPoints = bonus.requestedPoints;
          await dataStore.save(store);
          this.cloudFetch({ 
              action: "reviewBonusRequest", 
              id, 
              payload: { id, status: bonus.status, reviewerNote: bonus.reviewerNote, finalPoints: bonus.finalPoints } 
          }).catch(console.warn);
      }
      return bonus;
  }
}

export const mockService = new MockService();
