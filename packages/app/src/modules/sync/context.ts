import React, { createContext, useContext, type ReactNode } from "react";

// Database Context
export type SyncContextType = {
  replication: any | null;
  lastSyncTime: Date | null;
  isSyncing: boolean;
  isManualSyncing: boolean;
  initialSyncPerformed: boolean;
  showSyncDialog: boolean;
  localDocCount: number;
  manualSync: () => Promise<void>;
  handleSyncMerge: () => Promise<void>;
  handleSyncDeleteLocal: () => Promise<void>;
  closeSyncDialog: () => void;
  /** True while sync is not built yet. */
  syncUnavailable?: boolean;
};

export const SyncContext = createContext<SyncContextType | undefined>(
  undefined
);

/**
 * Storage moved from PouchDB (which synced live against a CouchDB-protocol
 * backend) to local-only wa-sqlite. Sync hasn't been rebuilt for the new
 * backend yet, so this is a stub (`syncUnavailable`) that lets
 * `sync.tsx` / `sync-status-badge.tsx` fall back to their existing
 * "coming soon" UI without changes.
 */
export const SyncProvider = ({ children }: { children: ReactNode }) => {
  const value: SyncContextType = {
    replication: null,
    lastSyncTime: null,
    isSyncing: false,
    isManualSyncing: false,
    initialSyncPerformed: false,
    showSyncDialog: false,
    localDocCount: 0,
    manualSync: async () => {
      throw new Error("Sync is not available yet");
    },
    handleSyncMerge: async () => {},
    handleSyncDeleteLocal: async () => {},
    closeSyncDialog: () => {},
    syncUnavailable: true,
  };

  return React.createElement(SyncContext.Provider, { value }, children);
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error("useSync must be used within a SyncProvider");
  }
  return context;
};
