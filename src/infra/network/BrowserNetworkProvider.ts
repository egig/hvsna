import type {
  INetworkProvider,
  NetworkStatus,
  NetworkListener,
} from "../../domain/network/INetworkProvider";

export class BrowserNetworkProvider implements INetworkProvider {
  async getStatus(): Promise<NetworkStatus> {
    return {
      connected: navigator.onLine,
      connectionType: (navigator as any).connection?.type || "unknown",
    };
  }

  async addListener(
    callback: (status: NetworkStatus) => void
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

  async removeListener(listener: NetworkListener): Promise<void> {
    await listener.remove();
  }
}
