import type { IFinanceRepository } from "../../domain/finance/IFinanceRepository";
import type {
  FinanceEntry,
  FinanceEntryCreateInput,
  FinanceEntryUpdateInput,
  FinanceQuery,
} from "../../domain/finance/IFinanceRepository";

export interface FinanceSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export class FinanceUseCases {
  constructor(private readonly repository: IFinanceRepository) {}

  createEntry(input: FinanceEntryCreateInput): Promise<FinanceEntry> {
    return this.repository.create(input);
  }

  updateEntry(id: string, input: FinanceEntryUpdateInput): Promise<FinanceEntry> {
    return this.repository.update(id, input);
  }

  deleteEntry(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  getEntries(query?: FinanceQuery): Promise<FinanceEntry[]> {
    return this.repository.find(query);
  }

  getEntryById(id: string): Promise<FinanceEntry | null> {
    return this.repository.findById(id);
  }

  getEntriesByType(type: "income" | "expense"): Promise<FinanceEntry[]> {
    return this.repository.find({ type });
  }

  getEntriesByDate(dateHijri: string): Promise<FinanceEntry[]> {
    return this.repository.find({ dateHijri });
  }

  async getSummary(query?: FinanceQuery): Promise<FinanceSummary> {
    const entries = await this.repository.find(query);
    let totalIncome = 0;
    let totalExpense = 0;
    for (const e of entries) {
      if (e.type === "income") totalIncome += e.amount ?? 0;
      else totalExpense += e.amount ?? 0;
    }
    return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
  }
}
