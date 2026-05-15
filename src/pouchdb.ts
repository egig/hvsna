import React, {
  createContext,
  useContext,
  type ReactNode,
  type Context,
} from "react";

export interface PouchDBContextType {
  db: PouchDB.Database;
}

const PouchDBContext: Context<PouchDBContextType | undefined> = createContext<
  PouchDBContextType | undefined
>(undefined);

export interface PouchDBProviderProps {
  children: ReactNode;
  dbInstance: PouchDB.Database;
}

export const PouchDBProvider: React.FC<PouchDBProviderProps> = ({
  dbInstance,
  children
}) => {
  return React.createElement(
    PouchDBContext.Provider,
    { value: { db: dbInstance} },
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
