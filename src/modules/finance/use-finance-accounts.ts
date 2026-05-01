import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePouchDB } from "../../pouchdb";
import { createFinanceAccountUseCases } from "../../usecases/finance/FinanceAccountUseCases";
import { queryKeys } from "../query-keys";
import type { FinanceAccountCreateInput, FinanceAccountUpdateInput } from "../../domain/finance/IFinanceAccountRepository";

export function useFinanceAccounts() {
  const { db } = usePouchDB();
  const useCases = useMemo(() => createFinanceAccountUseCases(db), [db]);

  return useQuery({
    queryKey: queryKeys.financeAccounts(),
    queryFn: () => useCases.getAccounts(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useFinanceAccountMutations() {
  const { db } = usePouchDB();
  const useCases = useMemo(() => createFinanceAccountUseCases(db), [db]);
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.financeAccounts() });
  };

  const createMutation = useMutation({
    mutationFn: (input: FinanceAccountCreateInput) => useCases.createAccount(input),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: FinanceAccountUpdateInput }) =>
      useCases.updateAccount(id, input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => useCases.deleteAccount(id),
    onSuccess: invalidate,
  });

  return {
    createAccount: (input: FinanceAccountCreateInput) => createMutation.mutateAsync(input),
    updateAccount: (id: string, input: FinanceAccountUpdateInput) =>
      updateMutation.mutateAsync({ id, input }),
    deleteAccount: (id: string) => deleteMutation.mutateAsync(id),
  };
}
