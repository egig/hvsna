import React, {
  createContext,
  useContext,
  type ReactNode,
  type Context,
} from "react";
import type { SqliteClient } from "./client";

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
  return React.createElement(
    SqliteContext.Provider,
    { value: { client } },
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
