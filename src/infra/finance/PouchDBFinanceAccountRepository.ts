import { generatePrefixedUUID } from "../../modules/uuid";
import type {
  IFinanceAccountRepository,
  FinanceAccountCreateInput,
  FinanceAccountUpdateInput,
} from "../../domain/finance/IFinanceAccountRepository";
import { FinanceAccount } from "../../domain/finance/IFinanceAccountRepository";

class PouchDBFinanceAccountDocument {
  _id?: string;
  _rev?: string;
  type: "finance_account" = "finance_account";
  name: string = "";
  icon?: string;
  createdAt: number = Date.now();
  updatedAt: number = Date.now();

  constructor(o: any) {
    Object.assign(this, o);
  }

  toFinanceAccount(): FinanceAccount {
    const account = new FinanceAccount();
    account.id = this._id;
    account.name = this.name;
    account.icon = this.icon;
    account.createdAt = this.createdAt;
    account.updatedAt = this.updatedAt;
    return account;
  }
}

export class PouchDBFinanceAccountRepository implements IFinanceAccountRepository {
  private readonly db: PouchDB.Database;

  constructor(db: PouchDB.Database) {
    this.db = db;
  }

  async create(input: FinanceAccountCreateInput): Promise<FinanceAccount> {
    const now = Date.now();
    const doc = new PouchDBFinanceAccountDocument({
      _id: generatePrefixedUUID("account_"),
      name: input.name,
      icon: input.icon,
      createdAt: now,
      updatedAt: now,
    });
    delete (doc as any)._rev;
    await this.db.put(doc);
    return doc.toFinanceAccount();
  }

  async update(id: string, input: FinanceAccountUpdateInput): Promise<FinanceAccount> {
    const existingDoc: any = await this.db.get(id);
    const doc = new PouchDBFinanceAccountDocument(existingDoc);
    Object.assign(
      doc,
      Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined))
    );
    doc.updatedAt = Date.now();
    doc._rev = existingDoc._rev;
    await this.db.put(doc);
    return doc.toFinanceAccount();
  }

  async delete(id: string): Promise<void> {
    const doc: any = await this.db.get(id);
    if (!doc._rev) throw new Error("Document revision is required for deletion");
    await this.db.remove(doc);
  }

  async findById(id: string): Promise<FinanceAccount | null> {
    try {
      const doc: any = await this.db.get(id);
      return new PouchDBFinanceAccountDocument(doc).toFinanceAccount();
    } catch (err) {
      if ((err as any).status === 404) return null;
      throw err;
    }
  }

  async find(): Promise<FinanceAccount[]> {
    await this.db.createIndex({
      index: { fields: ["type", "createdAt"] },
    });

    const result = await this.db.find({
      selector: {
        type: "finance_account",
        createdAt: { $gte: null },
      },
      sort: [{ type: "asc" }, { createdAt: "asc" }],
    });

    return (result as any).docs.map((doc: any) =>
      new PouchDBFinanceAccountDocument(doc).toFinanceAccount()
    );
  }
}
