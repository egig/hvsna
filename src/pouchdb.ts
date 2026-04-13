import React, {
  createContext,
  useContext,
  type ReactNode,
  type Context,
} from "react";
import { db } from "./modules/pouchdb-singleton";

export interface PouchDBContextType {
  db: PouchDB.Database;
}

const PouchDBContext: Context<PouchDBContextType | undefined> = createContext<
  PouchDBContextType | undefined
>(undefined);

export interface PouchDBProviderProps {
  children: ReactNode;
  dbName?: string;
  dbInstance?: PouchDB.Database;
}

export const PouchDBProvider: React.FC<PouchDBProviderProps> = ({
  children,
}) => {
  return React.createElement(
    PouchDBContext.Provider,
    { value: { db } },
    children
  );
};

export const usePouchDB = (): PouchDBContextType => {
  const context = useContext(PouchDBContext);
  if (context === undefined) {
    throw new Error("usePouchDB must be used within a PouchDBProvider");
  }
  return context;
};
