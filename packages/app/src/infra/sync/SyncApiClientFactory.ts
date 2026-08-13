import { api } from "@/modules/api/http-client";
import { SyncApiClient } from "./SyncApiClient";

let syncApiClientInstance: SyncApiClient | null = null;

export function getSyncApiClient(): SyncApiClient {
  if (!syncApiClientInstance) {
    syncApiClientInstance = new SyncApiClient(api);
  }
  return syncApiClientInstance;
}

/** Reset the singleton — for testing only */
export function _resetSyncApiClientSingleton(): void {
  syncApiClientInstance = null;
}
