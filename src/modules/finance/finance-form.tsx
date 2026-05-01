import React, { useState, useEffect, useMemo } from "react";
import { useFinanceContext } from "./finance-context";
import { useFinanceEntries } from "./use-finance-entries";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useHijriDate } from "../calendar/hijri/use-hijri-date";
import { formatHijriDateString } from "../task/task-form-helpers";
import type { HijriDate } from "../calendar/hijri/hijri-date";
import { DatePrayerInput } from "../task/date-prayer-input";
import { HvSearch, HvX } from "../icons";
import { Modal } from "../navigation";
import type { FinanceEntryType } from "../../domain/finance/IFinanceRepository";
import { useFinanceAccounts } from "./use-finance-accounts";

// --- Category Picker Modal ---

interface CategoryPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: string | undefined;
  allCategories: string[];
  onSelect: (cat: string) => void;
  onCreate: (cat: string) => void;
}

function CategoryPickerModal({
  isOpen,
  onClose,
  selectedCategory,
  allCategories,
  onSelect,
  onCreate,
}: CategoryPickerModalProps) {
  const [search, setSearch] = useState("");

  const normalized = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    const all = new Set(allCategories);
    const arr = Array.from(all).sort();
    if (!normalized) return arr;
    return arr.filter((c) => c.includes(normalized));
  }, [allCategories, normalized]);

  const showCreate = Boolean(
    normalized && !allCategories.includes(normalized)
  );

  const handleClose = () => {
    setSearch("");
    onClose();
  };

  const handleCreate = () => {
    if (normalized) {
      onCreate(normalized);
      setSearch("");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Category" noPadding>
      <div className="flex flex-col h-full">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <div className="relative">
            <HvSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search or create category..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--hvsna-primary-color)]"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && showCreate) {
                  e.preventDefault();
                  handleCreate();
                } else if (e.key === "Enter" && filtered.length > 0) {
                  e.preventDefault();
                  onSelect(filtered[0]);
                  handleClose();
                }
              }}
            />
          </div>
        </div>

        <ul className="overflow-y-auto h-72">
          {filtered.length === 0 && !showCreate && (
            <li className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
              {search.trim() ? "No matching category" : "Type to search or create a category"}
            </li>
          )}

          {showCreate && (
            <li>
              <button
                type="button"
                onClick={handleCreate}
                className="w-full text-left px-4 py-3 text-sm text-[var(--hvsna-primary-color)] transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700"
              >
                <span className="mr-1 font-medium">+</span> Create &ldquo;{normalized}&rdquo;
              </button>
            </li>
          )}

          {filtered.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <li key={cat}>
                <button
                  type="button"
                  onClick={() => { onSelect(cat); handleClose(); }}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between ${
                    isSelected
                      ? "font-semibold text-[var(--hvsna-primary-color)] bg-[var(--hvsna-primary-color)]/5"
                      : "text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <span>{cat}</span>
                  {isSelected && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 text-[var(--hvsna-primary-color)]">
                      <path d="M13 4L6 11L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Modal>
  );
}

// --- Account Picker Modal ---

interface AccountPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAccount: string | undefined;
  accounts: { id?: string; name: string; icon?: string }[];
  onSelect: (name: string) => void;
}

function AccountPickerModal({
  isOpen,
  onClose,
  selectedAccount,
  accounts,
  onSelect,
}: AccountPickerModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Account" noPadding>
      <ul className="overflow-y-auto max-h-80">
        {accounts.length === 0 && (
          <li className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
            No accounts — add some on the Accounts page
          </li>
        )}
        {accounts.map((acc) => {
          const isSelected = selectedAccount === acc.name;
          return (
            <li key={acc.id ?? acc.name}>
              <button
                type="button"
                onClick={() => { onSelect(acc.name); onClose(); }}
                className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center gap-3 ${
                  isSelected
                    ? "font-semibold text-[var(--hvsna-primary-color)] bg-[var(--hvsna-primary-color)]/5"
                    : "text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <span className="text-base">{acc.icon || "💵"}</span>
                <span className="flex-1">{acc.name}</span>
                {isSelected && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 text-[var(--hvsna-primary-color)]">
                    <path d="M13 4L6 11L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}

// --- Finance Form ---

interface FinanceFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function FinanceForm({ onSuccess, onCancel }: FinanceFormProps) {
  const { t } = useLanguageContext();
  const { createEntry, updateEntry, editingEntryId, closeForm } = useFinanceContext();
  const { data: entries } = useFinanceEntries();
  const { data: accounts = [] } = useFinanceAccounts();
  const { getToday } = useHijriDate();

  const today = getToday();

  const [entryType, setEntryType] = useState<FinanceEntryType>("expense");
  const [amount, setAmount] = useState("");
  const [selectedDate, setSelectedDate] = useState<HijriDate | null>(today);
  const [category, setCategory] = useState<string>("");
  const [account, setAccount] = useState<string>("");
  const [note, setNote] = useState("");
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editingEntry = editingEntryId
    ? entries?.find((e) => e.id === editingEntryId)
    : null;

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    entries?.forEach((e) => { if (e.category) cats.add(e.category); });
    return Array.from(cats).sort();
  }, [entries]);

  useEffect(() => {
    if (editingEntry) {
      setEntryType(editingEntry.type ?? "expense");
      setAmount(editingEntry.amount?.toString() ?? "");
      setCategory(editingEntry.category ?? "");
      setAccount(editingEntry.account ?? "");
      setNote(editingEntry.note ?? "");
    }
  }, [editingEntry]);

  const selectCategory = (cat: string) => {
    setCategory(cat);
  };

  const createCategory = (cat: string) => {
    setCategory(cat);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Amount must be greater than 0");
      return;
    }
    if (!selectedDate) {
      setError("Date is required");
      return;
    }

    const dateHijri = formatHijriDateString(
      selectedDate.year,
      selectedDate.month,
      selectedDate.day
    );

    setSubmitting(true);
    setError(null);

    try {
      if (editingEntryId) {
        await updateEntry(editingEntryId, {
          type: entryType,
          amount: parsedAmount,
          category: category || undefined,
          account: account || undefined,
          dateHijri,
          note: note.trim() || undefined,
        });
      } else {
        await createEntry({
          type: entryType,
          amount: parsedAmount,
          category: category || undefined,
          account: account || undefined,
          dateHijri,
          note: note.trim() || undefined,
        });
      }
      closeForm();
      onSuccess?.();
    } catch {
      setError("Failed to save entry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    closeForm();
    onCancel?.();
  };

  const isExpense = entryType === "expense";
  const activeColor = isExpense ? "var(--hvsna-danger-color)" : "var(--hvsna-success-color)";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <button
          type="button"
          onClick={handleCancel}
          className="text-gray-500 dark:text-gray-400 text-sm"
        >
          {t("cancel") || "Cancel"}
        </button>
        <h2 className="font-semibold text-base dark:text-white">
          {editingEntryId ? t("edit_entry") : t("log_entry")}
        </h2>
        <button
          type="button"
          disabled={submitting}
          style={{ color: activeColor }}
          className="font-semibold text-sm disabled:opacity-50"
          onClick={handleSubmit as any}
        >
          {submitting ? "..." : t("save") || "Save"}
        </button>
      </div>

      <form id="finance-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="px-4 py-4 space-y-4">
          {error && <p className="text-[var(--hvsna-danger-color)] text-sm">{error}</p>}

          {/* Type Toggle */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setEntryType("expense")}
              className="flex-1 py-2 text-sm font-medium transition-colors"
              style={
                isExpense
                  ? { backgroundColor: "var(--hvsna-danger-color)", color: "white" }
                  : {}
              }
            >
              {t("expense")}
            </button>
            <button
              type="button"
              onClick={() => setEntryType("income")}
              className="flex-1 py-2 text-sm font-medium transition-colors"
              style={
                !isExpense
                  ? { backgroundColor: "var(--hvsna-success-color)", color: "white" }
                  : {}
              }
            >
              {t("income")}
            </button>
          </div>


          {/* Date — first, default today */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              {t("date")}
            </label>
            <DatePrayerInput
              hijriDate={selectedDate}
              prayerTime=""
              atTime={null}
              isSubmitting={false}
              onChange={(date) => setSelectedDate(date)}
            />
          </div>

          {/* Account */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              {t("account") || "Account"}
            </label>
            <button
              type="button"
              onClick={() => setAccountModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 min-h-[40px] w-full text-left cursor-pointer"
            >
              {account ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-gray-900 dark:text-white">
                  <span>{accounts.find((a) => a.name === account)?.icon || "💵"}</span>
                  <span>{account}</span>
                </span>
              ) : (
                <span className="text-sm text-gray-400">{t("select_account") || "Select account..."}</span>
              )}
              {account && (
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="Clear account"
                  className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  onClick={(e) => { e.stopPropagation(); setAccount(""); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); setAccount(""); }
                  }}
                >
                  <HvX size={14} />
                </span>
              )}
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              {t("amount")}
            </label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              style={{ "--tw-ring-color": activeColor } as React.CSSProperties}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-lg font-semibold focus:outline-none focus:ring-2"
              required
            />
          </div>


          {/* Categories — modal picker */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              {t("category")}
            </label>
            <button
              type="button"
              onClick={() => setCategoryModalOpen(true)}
              className="flex flex-wrap gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 min-h-[40px] w-full text-left items-center cursor-pointer"
            >
              {category ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs">
                  {category}
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Remove ${category}`}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCategory("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        setCategory("");
                      }
                    }}
                  >
                    <HvX size={10} />
                  </span>
                </span>
              ) : (
                <span className="text-sm text-gray-400">Select category...</span>
              )}
            </button>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              {t("note")}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("note") || "Note (optional)"}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-[var(--hvsna-primary-color)]"
            />
          </div>
        </div>
      </form>

      <CategoryPickerModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        selectedCategory={category || undefined}
        allCategories={allCategories}
        onSelect={selectCategory}
        onCreate={createCategory}
      />

      <AccountPickerModal
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        selectedAccount={account || undefined}
        accounts={accounts}
        onSelect={(name) => setAccount(name)}
      />
    </div>
  );
}
