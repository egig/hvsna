export type FinanceEntryType = "income" | "expense";

export class FinanceEntry {
  id?: string;
  type?: FinanceEntryType;
  amount?: number;
  description?: string;
  category?: string;
  dateHijri?: string;
  note?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface FinanceEntryCreateInput {
  type: FinanceEntryType;
  amount: number;
  description?: string;
  category?: string;
  dateHijri: string;
  note?: string;
}

export interface FinanceEntryUpdateInput {
  type?: FinanceEntryType;
  amount?: number;
  description?: string;
  category?: string;
  dateHijri?: string;
  note?: string;
}

export interface FinanceQuery {
  type?: FinanceEntryType;
  dateHijri?: string;
  category?: string;
  searchText?: string;
}

export interface IFinanceRepository {
  create(input: FinanceEntryCreateInput): Promise<FinanceEntry>;
  update(id: string, input: FinanceEntryUpdateInput): Promise<FinanceEntry>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<FinanceEntry | null>;
  find(query?: FinanceQuery): Promise<FinanceEntry[]>;
}
