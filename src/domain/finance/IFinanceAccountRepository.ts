export class FinanceAccount {
  id?: string;
  name: string = "";
  icon?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface FinanceAccountCreateInput {
  name: string;
  icon?: string;
}

export interface FinanceAccountUpdateInput {
  name?: string;
  icon?: string;
}

export interface IFinanceAccountRepository {
  create(input: FinanceAccountCreateInput): Promise<FinanceAccount>;
  update(id: string, input: FinanceAccountUpdateInput): Promise<FinanceAccount>;
  delete(id: string): Promise<void>;
  find(): Promise<FinanceAccount[]>;
  findById(id: string): Promise<FinanceAccount | null>;
}
