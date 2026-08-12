import type { ISessionRepository } from "../../domain/auth/ISessionRepository";

const REFRESH_TOKEN_KEY = "auth_refresh_token";
const DB_NAME = "hvsna_secure_storage";
const STORE_NAME = "auth_tokens";

export class WebSessionRepository implements ISessionRepository {
  private db: IDBDatabase | null = null;

  private async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  private async get(key: string): Promise<string | null> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch {
      try {
        const value = localStorage.getItem(`secure_${key}`);
        return value ? atob(value) : null;
      } catch {
        return null;
      }
    }
  }

  private async set(key: string, value: string): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(value, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch {
      try {
        localStorage.setItem(`secure_${key}`, btoa(value));
      } catch {
        // silently fail if storage is full
      }
    }
  }

  private async remove(key: string): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch {
      try {
        localStorage.removeItem(`secure_${key}`);
      } catch {
        // silently fail
      }
    }
  }

  async getRefreshToken(): Promise<string | null> {
    return this.get(REFRESH_TOKEN_KEY);
  }

  async saveRefreshToken(token: string): Promise<void> {
    return this.set(REFRESH_TOKEN_KEY, token);
  }

  async clearRefreshToken(): Promise<void> {
    return this.remove(REFRESH_TOKEN_KEY);
  }
}
