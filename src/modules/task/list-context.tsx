import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface ListContextType {
  // Form state management
  editingListId: string | null;
  formOpen: boolean;
  openListForm: (listId?: string) => void;
  closeListForm: () => void;
  setEditingListId: (listId: string | null) => void;
}

const ListContext = createContext<ListContextType | undefined>(undefined);

export const ListProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  // Local form state
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState<boolean>(false);

  // Local form functions
  const openListForm = (listId?: string) => {
    setEditingListId(listId || null);
    setFormOpen(true);
  };

  const closeListForm = () => {
    setEditingListId(null);
    setFormOpen(false);
  };

  const contextValue: ListContextType = {
    editingListId,
    formOpen,
    openListForm,
    closeListForm,
    setEditingListId,
  };

  return (
    <ListContext.Provider value={contextValue}>{children}</ListContext.Provider>
  );
};

export const useListContext = (): ListContextType => {
  const context = useContext(ListContext);
  if (!context) {
    throw new Error("useListContext must be used within a ListProvider");
  }
  return context;
};
