import React, { createContext, useContext, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePouchDB } from "../../pouchdb";
import { createFinanceUseCases } from "../../usecases/finance";
import type {
  FinanceEntry,
  FinanceEntryCreateInput,
  FinanceEntryUpdateInput,
} from "../../domain/finance/IFinanceRepository";

interface FinanceContextType {
  createEntry: (input: FinanceEntryCreateInput) => Promise<FinanceEntry>;
  updateEntry: (id: string, input: FinanceEntryUpdateInput) => Promise<FinanceEntry>;
  deleteEntry: (id: string) => Promise<void>;
  formOpen: boolean;
  editingEntryId: string | null;
  openCreateForm: () => void;
  openEditForm: (id: string) => void;
  closeForm: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { db } = usePouchDB();
  const useCases = createFinanceUseCases(db);

  const [formOpen, setFormOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["finance-entries"] });
  };

  const createMutation = useMutation({
    mutationFn: (input: FinanceEntryCreateInput) => useCases.createEntry(input),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: FinanceEntryUpdateInput }) =>
      useCases.updateEntry(id, input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => useCases.deleteEntry(id),
    onSuccess: invalidate,
  });

  const createEntry = (input: FinanceEntryCreateInput) =>
    createMutation.mutateAsync(input);

  const updateEntry = (id: string, input: FinanceEntryUpdateInput) =>
    updateMutation.mutateAsync({ id, input });

  const deleteEntry = (id: string) => deleteMutation.mutateAsync(id);

  const openCreateForm = () => {
    setEditingEntryId(null);
    setFormOpen(true);
  };

  const openEditForm = (id: string) => {
    setEditingEntryId(id);
    setFormOpen(true);
  };

  const closeForm = () => {
    setEditingEntryId(null);
    setFormOpen(false);
  };

  return (
    <FinanceContext.Provider
      value={{
        createEntry,
        updateEntry,
        deleteEntry,
        formOpen,
        editingEntryId,
        openCreateForm,
        openEditForm,
        closeForm,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinanceContext = (): FinanceContextType => {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinanceContext must be used within FinanceProvider");
  return ctx;
};
