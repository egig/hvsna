import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  type Context,
} from "react";
import type { SqliteClient } from "./client";
import { DatabaseLockedOverlay } from "./database-locked-overlay";

export interface SqliteContextType {
  client: SqliteClient;
}

const SqliteContext: Context<SqliteContextType | undefined> = createContext<
  SqliteContextType | undefined
>(undefined);

export interface SqliteProviderProps {
  children: ReactNode;
  client: SqliteClient;
}

export const SqliteProvider: React.FC<SqliteProviderProps> = ({
  client,
  children,
}) => {
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    return client.onLockStateChange((state) => setLocked(state === "locked"));
  }, [client]);

  return React.createElement(
    SqliteContext.Provider,
    { value: { client } },
    locked && React.createElement(DatabaseLockedOverlay),
    children
  );
};

export const useSqliteClient = (): SqliteContextType => {
  const context = useContext(SqliteContext);
  if (context === undefined) {
    throw new Error("useSqliteClient must be used within a SqliteProvider");
  }
  return context;
};
