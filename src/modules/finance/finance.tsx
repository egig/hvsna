import React from "react";
import { Link } from "react-router";
import { FinanceProvider, useFinanceContext } from "./finance-context";
import { useFinanceEntries, useFinanceSummary } from "./use-finance-entries";
import { FinanceListItem } from "./finance-list-item";
import { FinanceForm } from "./finance-form";
import { useLanguageContext } from "../i18n/LanguageContext";
import { Navbar } from "../navigation/navbar";
import { Modal } from "../navigation/modal";
import { EmptyState } from "../components/empty-state";
import { Wallet } from "lucide-react";
import { HvPlus, HvLandmark } from "../icons";
import { parseHijriDateString } from "../task/task-form-helpers";
import type { FinanceEntry } from "../../domain/finance/IFinanceRepository";
import { Page } from "../navigation";
import { NavActionButton } from "../components/nav-action-button";

function formatAmount(amount: number): string {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function groupEntriesByDate(entries: FinanceEntry[]): Map<string, FinanceEntry[]> {
  const groups = new Map<string, FinanceEntry[]>();
  for (const entry of entries) {
    const key = entry.dateHijri ?? "unknown";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(entry);
  }
  return groups;
}

function formatGroupDate(dateHijri: string): string {
  try {
    const { year, month, day } = parseHijriDateString(dateHijri);
    return `${day}/${month}/${year} H`;
  } catch {
    return dateHijri;
  }
}

function FinancePage() {
  const { t } = useLanguageContext();
  const { openCreateForm, formOpen, closeForm } = useFinanceContext();
  const { data: entries = [], isLoading } = useFinanceEntries();
  const { data: summary } = useFinanceSummary();

  const sortedEntries = [...entries].sort((a, b) => {
    const dateA = a.dateHijri ?? "";
    const dateB = b.dateHijri ?? "";
    if (dateB !== dateA) return dateB.localeCompare(dateA);
    return (b.createdAt ?? 0) - (a.createdAt ?? 0);
  });

  const grouped = groupEntriesByDate(sortedEntries);
  const groupKeys = Array.from(grouped.keys());

  const balance = summary?.balance ?? 0;
  const totalIncome = summary?.totalIncome ?? 0;
  const totalExpense = summary?.totalExpense ?? 0;

  return (
    <Page
      navbar={
        <Navbar
          title={t("finance")}
          showBackButton={false}
          rightAction={
            <div className="flex items-center gap-1">
              <Link
                to="/accounts"
                aria-label={t("accounts") || "Accounts"}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <HvLandmark size={20} />
              </Link>
              <div className="hidden md:block">
                <NavActionButton
                  variant="neutral"
                  onClick={openCreateForm}
                  aria-label={t("log_entry")}
                >
                  <HvPlus size={20} />
                </NavActionButton>
              </div>
            </div>
          }
        />
      }
    >

      <div className="flex-1 overflow-y-auto">
        {/* Summary card */}
        {(totalIncome > 0 || totalExpense > 0) && (
          <div className="mx-4 mt-4 mb-2 rounded-xl bg-gray-50 dark:bg-gray-800 p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t("balance")}</p>
                <p
                  className={`text-2xl font-bold mt-0.5 ${
                    balance >= 0
                      ? "text-gray-900 dark:text-white"
                      : "text-[var(--hvsna-danger-color)] dark:text-[var(--hvsna-danger-color)]"
                  }`}
                >
                  {formatAmount(balance)}
                </p>
              </div>
              <div className="text-right space-y-1">
                <div>
                  <span className="text-xs text-gray-400">{t("income")} </span>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    +{formatAmount(totalIncome)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-400">{t("expense")} </span>
                  <span className="text-sm font-medium text-[var(--hvsna-danger-color)] dark:text-[var(--hvsna-danger-color)]">
                    -{formatAmount(totalExpense)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Entry list */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-[var(--hvsna-primary-color)] rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <EmptyState
            icon={<Wallet className="w-10 h-10 text-gray-300" />}
            title={t("no_entries_yet")}
            description={t("no_entries_description")}
          />
        ) : (
          <div className="mt-2">
            {groupKeys.map((dateKey) => (
              <div key={dateKey} className="mb-2">
                <div className="px-4 py-1.5 bg-gray-50 dark:bg-gray-800/50">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {formatGroupDate(dateKey)}
                  </span>
                </div>
                <div className="rounded-xl overflow-hidden mx-0">
                  {grouped.get(dateKey)!.map((entry) => (
                    <FinanceListItem key={entry.id} entry={entry} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form modal */}
      <Modal isOpen={formOpen} onClose={closeForm} noPadding>
        <FinanceForm />
      </Modal>
    </Page>
  );
}

export default function Finance() {
  return (
    <FinanceProvider>
      <FinancePage />
    </FinanceProvider>
  );
}
