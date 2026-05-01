import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePouchDB } from "../../pouchdb";
import { createFinanceUseCases } from "../../usecases/finance";
import { queryKeys } from "../query-keys";
import type { FinanceQuery } from "../../domain/finance/IFinanceRepository";

export function useFinanceEntries(query?: FinanceQuery) {
  const { db } = usePouchDB();
  const useCases = useMemo(() => createFinanceUseCases(db), [db]);

  return useQuery({
    queryKey: queryKeys.financeEntries(JSON.stringify(query)),
    queryFn: () => useCases.getEntries(query),
    staleTime: 1000 * 60 * 5,
  });
}

export function useFinanceSummary(query?: FinanceQuery) {
  const { db } = usePouchDB();
  const useCases = useMemo(() => createFinanceUseCases(db), [db]);

  return useQuery({
    queryKey: [...queryKeys.financeEntries(JSON.stringify(query)), "summary"],
    queryFn: () => useCases.getSummary(query),
    staleTime: 1000 * 60 * 5,
  });
}
