import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

export interface SecureStorageInterface {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

class WebStorage implements SecureStorageInterface {
  private dbName = 'hvsna_secure_storage';
  private storeName = 'auth_tokens';
  private db: IDBDatabase | null = null;

  private async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => {
        console.warn('IndexedDB not available, falling back to localStorage');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  async get(key: string): Promise<string | null> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      // Fallback to localStorage if IndexedDB fails
      try {
        const value = localStorage.getItem(`secure_${key}`);
        return value ? atob(value) : null; // Decode base64
      } catch {
        return null;
      }
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put(value, key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      // Fallback to localStorage if IndexedDB fails
      try {
        localStorage.setItem(`secure_${key}`, btoa(value)); // Encode base64
      } catch {
        // Silently fail if localStorage is full
      }
    }
  }

  async remove(key: string): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      // Fallback to localStorage if IndexedDB fails
      try {
        localStorage.removeItem(`secure_${key}`);
      } catch {
        // Silently fail
      }
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      // Fallback to localStorage if IndexedDB fails
      try {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('secure_'));
        keys.forEach(key => localStorage.removeItem(key));
      } catch {
        // Silently fail
      }
    }
  }
}

class CapacitorStorage implements SecureStorageInterface {
  async get(key: string): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key });
      return value;
    } catch (error) {
      console.error('Capacitor storage get error:', error);
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      await Preferences.set({ key, value });
    } catch (error) {
      console.error('Capacitor storage set error:', error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await Preferences.remove({ key });
    } catch (error) {
      console.error('Capacitor storage remove error:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await Preferences.clear();
    } catch (error) {
      console.error('Capacitor storage clear error:', error);
      throw error;
    }
  }
}

class SecureStorage implements SecureStorageInterface {
  private storage: SecureStorageInterface;

  constructor() {
    this.storage = Capacitor.isNativePlatform() 
      ? new CapacitorStorage() 
      : new WebStorage();
  }

  async get(key: string): Promise<string | null> {
    return this.storage.get(key);
  }

  async set(key: string, value: string): Promise<void> {
    return this.storage.set(key, value);
  }

  async remove(key: string): Promise<void> {
    return this.storage.remove(key);
  }

  async clear(): Promise<void> {
    return this.storage.clear();
  }

  // Convenience methods for token management
  async getRefreshToken(): Promise<string | null> {
    return this.get('auth_refresh_token');
  }

  async setRefreshToken(token: string): Promise<void> {
    return this.set('auth_refresh_token', token);
  }

  async removeRefreshToken(): Promise<void> {
    return this.remove('auth_refresh_token');
  }

  async clearAuthTokens(): Promise<void> {
    await this.remove('auth_refresh_token');
    // Note: Access token is stored in memory only
  }
}

export const secureStorage = new SecureStorage();
export default secureStorage;
