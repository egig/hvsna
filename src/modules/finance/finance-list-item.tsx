import React from "react";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useHijriDate } from "../calendar/hijri/use-hijri-date";
import { parseHijriDateString } from "../task/task-form-helpers";
import { HijriDate } from "../calendar/hijri/hijri-date";
import { useFinanceContext } from "./finance-context";
import { HvTrash2 } from "../icons";
import type { FinanceEntry } from "../../domain/finance/IFinanceRepository";

interface FinanceListItemProps {
  entry: FinanceEntry;
}

function formatAmount(amount: number): string {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatEntryDate(dateHijri: string): string {
  try {
    const { year, month, day } = parseHijriDateString(dateHijri);
    const d = new HijriDate(year, month, day);
    return d.format("D MMM YYYY H");
  } catch {
    return dateHijri;
  }
}

export function FinanceListItem({ entry }: FinanceListItemProps) {
  const { t } = useLanguageContext();
  const { openEditForm, deleteEntry } = useFinanceContext();

  const isIncome = entry.type === "income";

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!entry.id) return;
    if (confirm(t("delete_entry") || "Delete this entry?")) {
      await deleteEntry(entry.id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => entry.id && openEditForm(entry.id)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") entry.id && openEditForm(entry.id); }}
      className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 last:border-0 cursor-pointer active:bg-gray-50 dark:active:bg-gray-800/60 transition-colors"
    >
      {/* Type indicator */}
      <div
        className={`w-1 self-stretch rounded-full flex-shrink-0 ${
          isIncome ? "bg-[var(--hvsna-success-color)]" : "bg-[var(--hvsna-danger-color)]"
        }`}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {entry.description}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
          {entry.dateHijri && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {formatEntryDate(entry.dateHijri)}
            </span>
          )}
          {entry.account && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
              {entry.account}
            </span>
          )}
          {entry.category && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              {entry.category}
            </span>
          )}
        </div>
        {entry.note && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
            {entry.note}
          </p>
        )}
      </div>

      {/* Amount + delete */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className={`text-base font-semibold ${
            isIncome
              ? "text-green-600 dark:text-green-400"
              : "text-[var(--hvsna-danger-color)] dark:text-[var(--hvsna-danger-color)]"
          }`}
        >
          {isIncome ? "+" : "-"}
          {formatAmount(entry.amount ?? 0)}
        </span>
        <button
          onClick={handleDelete}
          className="p-1.5 -mr-1 text-gray-300 dark:text-gray-600 hover:text-[var(--hvsna-danger-color)] dark:hover:text-[var(--hvsna-danger-color)] rounded transition-colors"
          title={t("delete_entry")}
        >
          <HvTrash2 size={14} />
        </button>
      </div>
    </div>
  );
}
