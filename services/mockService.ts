
import { Issue, TaskStatus, User, Role, MediaItem, WardRegistration, RegistrationStatus, BonusRequest, BonusStatus } from '../types';
import { getAreaConfig, BONUS_CRITERIA_LIST } from '../constants';
import { dataStore } from '../storage/store';
import { getApiUrl } from './apiConfig';

class MockService {
  private currentUser: User | null = null;
  private isOnline: boolean = true;

  constructor() {
    this.restoreSession();
  }

  private async restoreSession() {
      const savedEmail = localStorage.getItem('pc06_last_session_email');
      if (savedEmail) {
          const store = await dataStore.getStore();
          const user = Object.values(store.users).find(u => u.email === savedEmail);
          if (user) {
              this.currentUser = user;
              this.pullFromCloud();
          }
      }
  }

  async login(email: string) {
    const store = await dataStore.getStore();
    const user = Object.values(store.users).find(u => u.email === email);
    return { success: !!user, requires2FA: !!user };
  }

  async verifyOTP(email: string, otp: string) {
    if (otp === '123456') {
      const store = await dataStore.getStore();
      const user = Object.values(store.users).find(u => u.email === email);
      if (user) {
          this.currentUser = user;
          localStorage.setItem('pc06_last_session_email', user.email);
          await this.pullFromCloud();
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

  /**
   * CƠ CHẾ TRUYỀN TIN SIÊU CẤP (Ultra-Reliable Fetch)
   * 1. Thêm timestamp để tránh bị trình duyệt cache lỗi 404.
   * 2. Xử lý Redirect thủ công để Google Script không bị lạc hướng.
   */
  private async cloudFetch(params: any) {
      const baseUrl = getApiUrl();
      if (!baseUrl || baseUrl.includes('YOUR_URL_HERE')) return { ok: false, error: 'Chưa cấu hình Cloud' };

      // Chống Cache bằng cách thêm mã độc nhất cho mỗi request
      const antiCacheUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}cb=${Date.now()}`;

      try {
          const response = await fetch(antiCacheUrl, {
              method: 'POST',
              mode: 'no-cors', // Dùng no-cors để đảm bảo request LUÔN đi tới đích mà không bị pre-flight chặn
              headers: { 'Content-Type': 'text/plain' },
              body: JSON.stringify(params),
          });

          // Đối với lệnh GET (lấy dữ liệu), ta cần mode 'cors' và handle redirect
          if (params.action === "getAllData" || params.action === "ping") {
              const queryUrl = `${antiCacheUrl}&action=${params.action}&payload=${encodeURIComponent(JSON.stringify(params))}`;
              const res = await fetch(queryUrl, { method: 'GET', redirect: 'follow' });
              if (!res.ok) throw new Error(`Server báo lỗi ${res.status}`);
              const json = await res.json();
              this.isOnline = true;
              return json;
          }

          this.isOnline = true;
          return { ok: true, message: "Gửi mây thành công" };
      } catch (e: any) {
          console.warn("Cloud Sync Offline:", e.message);
          this.isOnline = false;
          return { ok: false, error: e.message };
      }
  }

  async testApiConnection() {
      return await this.cloudFetch({ action: "ping" });
  }

  async pullFromCloud() {
      const result = await this.cloudFetch({ action: "getAllData" });
      if (result.ok && result.data) {
          const store = await dataStore.getStore();
          if (result.data.issues) {
              store.issues = {};
              result.data.issues.forEach((i: Issue) => { store.issues[i.id] = i; });
          }
          await dataStore.save(store);
          return { success: true, count: result.data.issues?.length || 0 };
      }
      return { success: false, error: result.error };
  }

  // Các phương thức nghiệp vụ
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
      this.cloudFetch({ action: "createIssue", payload: newIssue, operator }); // Chạy ngầm
      return newIssue;
  }

  async updateIssue(id: string, updates: any, reason: string, operator: string) {
      const store = await dataStore.getStore();
      const issue = store.issues[id];
      if (issue) {
          Object.assign(issue, updates);
          await dataStore.save(store);
          this.cloudFetch({ action: "updateIssue", id, payload: updates, operator }); // Chạy ngầm
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
      return Object.values(store.registrations);
  }

  async getBonusRequests(wardId?: string) {
      const store = await dataStore.getStore();
      return Object.values(store.bonusRequests);
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
      this.cloudFetch({ action: "submitRegistration", payload: newReg });
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
          this.cloudFetch({ action: "reviewRegistration", id, reviewAction: action, note });
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
          bonus.reviewedBy = this.currentUser?.email;
          if (action === 'APPROVE') bonus.finalPoints = bonus.requestedPoints;
          await dataStore.save(store);
          this.cloudFetch({ action: "reviewBonusRequest", id, reviewAction: action, note });
      }
      return bonus;
  }
}

export const mockService = new MockService();
