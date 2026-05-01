import { createFinanceRepository } from "../../infra/finance/FinanceRepositoryFactory";
import { FinanceUseCases } from "./FinanceUseCases";

export function createFinanceUseCases(db: PouchDB.Database): FinanceUseCases {
  const repository = createFinanceRepository(db);
  return new FinanceUseCases(repository);
}
