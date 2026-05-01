import { PouchDBFinanceAccountRepository } from "../../infra/finance/PouchDBFinanceAccountRepository";
import type {
  IFinanceAccountRepository,
  FinanceAccount,
  FinanceAccountCreateInput,
  FinanceAccountUpdateInput,
} from "../../domain/finance/IFinanceAccountRepository";

export class FinanceAccountUseCases {
  constructor(private readonly repository: IFinanceAccountRepository) {}

  createAccount(input: FinanceAccountCreateInput): Promise<FinanceAccount> {
    return this.repository.create(input);
  }

  updateAccount(id: string, input: FinanceAccountUpdateInput): Promise<FinanceAccount> {
    return this.repository.update(id, input);
  }

  deleteAccount(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  getAccounts(): Promise<FinanceAccount[]> {
    return this.repository.find();
  }

  getAccountById(id: string): Promise<FinanceAccount | null> {
    return this.repository.findById(id);
  }
}

export function createFinanceAccountUseCases(db: PouchDB.Database): FinanceAccountUseCases {
  return new FinanceAccountUseCases(new PouchDBFinanceAccountRepository(db));
}
