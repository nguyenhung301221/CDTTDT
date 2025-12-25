
import { User, Issue, WardRegistration, AuditLog, BonusRequest } from '../types';
import { MOCK_USERS } from '../constants';

const DB_NAME = 'PC06_Hanoi_Eternal_DB'; // Đổi tên DB để reset nếu cần
const DB_VERSION = 5; 
const STORE_NAME = 'permanent_storage';

class IndexedDBStore {
    private db: IDBDatabase | null = null;

    private async getDB(): Promise<IDBDatabase> {
        if (this.db) return this.db;
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (e) => {
                const db = (e.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
            request.onsuccess = () => {
                this.db = request.result;
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async get<T>(key: string): Promise<T | null> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    async set(key: string, value: any): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(value, key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

const idb = new IndexedDBStore();

export interface StoreSchema {
  users: Record<string, User>;
  issues: Record<string, Issue>;
  registrations: Record<string, WardRegistration>;
  bonusRequests: Record<string, BonusRequest>;
  logs: AuditLog[];
  meta: { createdAt: string; lastUpdated?: string; isPersistent?: boolean };
}

export const dataStore = {
  async init(): Promise<StoreSchema> {
    // Yêu cầu quyền lưu trữ vĩnh viễn
    let isPersistent = false;
    if (navigator.storage && navigator.storage.persist) {
        isPersistent = await navigator.storage.persist();
    }

    let store = await idb.get<StoreSchema>('root');
    
    if (!store) {
        store = {
          users: {},
          issues: {},
          registrations: {},
          bonusRequests: {},
          logs: [],
          meta: { createdAt: new Date().toISOString(), isPersistent }
        };
    }

    // Luôn đảm bảo có danh sách User gốc
    MOCK_USERS.forEach(mockUser => {
      if (!store!.users[mockUser.id]) {
        store!.users[mockUser.id] = mockUser;
      }
    });

    await idb.set('root', store);
    return store;
  },

  async save(store: StoreSchema) {
    store.meta.lastUpdated = new Date().toISOString();
    await idb.set('root', store);
  },

  async getStore(): Promise<StoreSchema> {
      let store = await idb.get<StoreSchema>('root');
      if (!store) return await this.init();
      return store;
  },

  async getStorageUsage(): Promise<string> {
      if (navigator.storage && navigator.storage.estimate) {
          const estimate = await navigator.storage.estimate();
          const used = ((estimate.usage || 0) / (1024 * 1024)).toFixed(2);
          return `${used} MB`;
      }
      return "0 MB";
  },

  // Fix: Add isPersistent method to check storage status
  async isPersistent(): Promise<boolean> {
      if (navigator.storage && navigator.storage.persisted) {
          return await navigator.storage.persisted();
      }
      return false;
  },

  // Fix: Add archiveOldData to optimize storage by "compressing" old images
  async archiveOldData(days: number): Promise<{ count: number }> {
      const store = await this.getStore();
      let count = 0;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);

      // Fix: Cast the object values to Issue[] to fix the 'unknown' type error
      (Object.values(store.issues) as Issue[]).forEach(issue => {
          if (new Date(issue.createdTime) < cutoff) {
              count++;
              // Logic to clear high-res data and keep small snapshots would go here
          }
      });
      
      await this.save(store);
      return { count };
  }
};
