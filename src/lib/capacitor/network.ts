import { Capacitor } from "@capacitor/core";
import { Network } from "@capacitor/network";

export interface NetworkStatus {
  connected: boolean;
  connectionType: string;
}

export interface NetworkListener {
  callback: (status: NetworkStatus) => void;
  remove: () => Promise<void>;
}

/**
 * Capacitor network service with browser fallback
 */
export class CapacitorNetwork {
  /**
   * Check if running on native platform
   */
  static isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Get current network status
   */
  static async getStatus(): Promise<NetworkStatus> {
    if (this.isNativePlatform()) {
      return this.getStatusNative();
    } else {
      return this.getStatusBrowser();
    }
  }

  /**
   * Get network status using Capacitor native API
   */
  private static async getStatusNative(): Promise<NetworkStatus> {
    try {
      const status = await Network.getStatus();
      return {
        connected: status.connected,
        connectionType: status.connectionType,
      };
    } catch (error) {
      console.error("Network getStatus error:", error);
      return {
        connected: navigator.onLine,
        connectionType: "unknown",
      };
    }
  }

  /**
   * Get network status using browser API
   */
  private static async getStatusBrowser(): Promise<NetworkStatus> {
    return {
      connected: navigator.onLine,
      connectionType: (navigator as any).connection?.type || "unknown",
    };
  }

  /**
   * Add listener for network status changes
   */
  static async addListener(
    callback: (status: NetworkStatus) => void,
  ): Promise<NetworkListener> {
    if (this.isNativePlatform()) {
      return this.addListenerNative(callback);
    } else {
      return this.addListenerBrowser(callback);
    }
  }

  /**
   * Add listener using Capacitor native API
   */
  private static async addListenerNative(
    callback: (status: NetworkStatus) => void,
  ): Promise<NetworkListener> {
    const handle = await Network.addListener(
      "networkStatusChange",
      (status) => {
        callback({
          connected: status.connected,
          connectionType: status.connectionType,
        });
      },
    );

    return {
      callback,
      remove: async () => {
        await handle.remove();
      },
    };
  }

  /**
   * Add listener using browser API
   */
  private static async addListenerBrowser(
    callback: (status: NetworkStatus) => void,
  ): Promise<NetworkListener> {
    const handleOnline = () => {
      callback({
        connected: true,
        connectionType: (navigator as any).connection?.type || "unknown",
      });
    };

    const handleOffline = () => {
      callback({
        connected: false,
        connectionType: "none",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return {
      callback,
      remove: async () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      },
    };
  }

  /**
   * Remove network listener
   */
  static async removeListener(listener: NetworkListener): Promise<void> {
    await listener.remove();
  }
}
