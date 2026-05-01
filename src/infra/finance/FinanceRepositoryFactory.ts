import type { IFinanceRepository } from "../../domain/finance/IFinanceRepository";
import { PouchDBFinanceRepository } from "./PouchDBFinanceRepository";

export function createFinanceRepository(db: PouchDB.Database): IFinanceRepository {
  return new PouchDBFinanceRepository(db);
}
