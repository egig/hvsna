import { createContext, useContext, type ReactNode } from "react";
import type { DbExecutor } from "./executor";

const DatabaseContext = createContext<DbExecutor | undefined>(undefined);

export function DatabaseProvider({
  database,
  children,
}: {
  database: DbExecutor;
  children: ReactNode;
}) {
  return <DatabaseContext.Provider value={database}>{children}</DatabaseContext.Provider>;
}

export const useDatabase = (): DbExecutor => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error("useDatabase must be used within a DatabaseProvider");
  }
  return context;
};
