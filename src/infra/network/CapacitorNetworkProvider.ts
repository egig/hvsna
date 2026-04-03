import { Network } from "@capacitor/network";
import type {
  INetworkProvider,
  NetworkStatus,
  NetworkListener,
} from "../../domain/network/INetworkProvider";

export class CapacitorNetworkProvider implements INetworkProvider {
  async getStatus(): Promise<NetworkStatus> {
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

  async addListener(
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

  async removeListener(listener: NetworkListener): Promise<void> {
    await listener.remove();
  }
}
