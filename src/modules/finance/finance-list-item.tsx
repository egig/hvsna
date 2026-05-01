import React, { useState } from "react";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useHijriDate } from "../calendar/hijri/use-hijri-date";
import { parseHijriDateString } from "../task/task-form-helpers";
import { HijriDate } from "../calendar/hijri/hijri-date";
import { useFinanceContext } from "./finance-context";
import { HvEdit2, HvTrash2 } from "../icons";
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
  const [showActions, setShowActions] = useState(false);

  const isIncome = entry.type === "income";

  const handleDelete = async () => {
    if (!entry.id) return;
    if (confirm(t("delete_entry") || "Delete this entry?")) {
      await deleteEntry(entry.id);
    }
  };

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 last:border-0"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
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
        <div className="flex items-center gap-2 mt-0.5">
          {entry.dateHijri && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {formatEntryDate(entry.dateHijri)}
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

      {/* Amount */}
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

        {/* Desktop hover actions */}
        {showActions && entry.id && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => openEditForm(entry.id!)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded"
              title={t("edit_entry")}
            >
              <HvEdit2 size={14} />
            </button>
            <button
              onClick={handleDelete}
              className="p-1 text-gray-400 hover:text-red-500 rounded"
              title={t("delete_entry")}
            >
              <HvTrash2 size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
