import React, { useState } from "react";
import { Navbar } from "../navigation/navbar";
import { Page } from "../navigation";
import { useLanguageContext } from "../i18n/LanguageContext";
import { HvPlus, HvEdit2, HvTrash2, HvX } from "../icons";
import { NavActionButton } from "../components/nav-action-button";
import { useFinanceAccounts, useFinanceAccountMutations } from "./use-finance-accounts";
import type { FinanceAccount } from "../../domain/finance/IFinanceAccountRepository";

const ACCOUNT_EMOJIS = ["💵", "🏦", "💳", "📱", "💰", "🪙", "🏧", "💼"];

interface AccountFormProps {
  initial?: { name: string; icon?: string };
  onSubmit: (name: string, icon?: string) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}

function AccountForm({ initial, onSubmit, onCancel, submitting }: AccountFormProps) {
  const { t } = useLanguageContext();
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t("account_name_required") || "Account name is required");
      return;
    }
    setError(null);
    await onSubmit(trimmed, icon || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-sm text-[var(--hvsna-danger-color)]">{error}</p>}

      <div className="flex flex-wrap gap-2 mb-1">
        {ACCOUNT_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => setIcon(icon === emoji ? "" : emoji)}
            className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border transition-colors ${
              icon === emoji
                ? "border-[var(--hvsna-primary-color)] bg-[var(--hvsna-primary-color)]/10"
                : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("account_name") || "Account name"}
        autoFocus
        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--hvsna-primary-color)]"
      />

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400"
        >
          {t("cancel") || "Cancel"}
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 py-2 rounded-lg bg-[var(--hvsna-primary-color)] text-white text-sm font-medium disabled:opacity-50"
        >
          {submitting ? "..." : t("save") || "Save"}
        </button>
      </div>
    </form>
  );
}

interface AccountRowProps {
  account: FinanceAccount;
  onEdit: (account: FinanceAccount) => void;
  onDelete: (account: FinanceAccount) => void;
}

function AccountRow({ account, onEdit, onDelete }: AccountRowProps) {
  const { t } = useLanguageContext();
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg flex-shrink-0">
        {account.icon || "💵"}
      </div>
      <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
        {account.name}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onEdit(account)}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded"
          title={t("edit_account") || "Edit account"}
        >
          <HvEdit2 size={15} />
        </button>
        <button
          onClick={() => onDelete(account)}
          className="p-1.5 text-gray-400 hover:text-[var(--hvsna-danger-color)] rounded"
          title={t("delete_account") || "Delete account"}
        >
          <HvTrash2 size={15} />
        </button>
      </div>
    </div>
  );
}

export default function AccountsPage() {
  const { t } = useLanguageContext();
  const { data: accounts = [], isLoading } = useFinanceAccounts();
  const { createAccount, updateAccount, deleteAccount } = useFinanceAccountMutations();

  const [mode, setMode] = useState<"idle" | "create" | "edit">("idle");
  const [editingAccount, setEditingAccount] = useState<FinanceAccount | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (name: string, icon?: string) => {
    setSubmitting(true);
    try {
      await createAccount({ name, icon });
      setMode("idle");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (name: string, icon?: string) => {
    if (!editingAccount?.id) return;
    setSubmitting(true);
    try {
      await updateAccount(editingAccount.id, { name, icon });
      setMode("idle");
      setEditingAccount(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (account: FinanceAccount) => {
    if (!account.id) return;
    if (confirm(t("delete_account_confirm") || `Delete "${account.name}"?`)) {
      await deleteAccount(account.id);
    }
  };

  const startEdit = (account: FinanceAccount) => {
    setEditingAccount(account);
    setMode("edit");
  };

  const cancelForm = () => {
    setMode("idle");
    setEditingAccount(null);
  };

  return (
    <Page
      navbar={
        <Navbar
          title={t("accounts") || "Accounts"}
          showBackButton
          rightAction={
            mode === "idle" ? (
              <NavActionButton
                variant="neutral"
                onClick={() => setMode("create")}
                aria-label={t("add_account") || "Add account"}
              >
                <HvPlus size={20} />
              </NavActionButton>
            ) : (
              <NavActionButton variant="neutral" onClick={cancelForm} aria-label="Close">
                <HvX size={20} />
              </NavActionButton>
            )
          }
        />
      }
    >
      <div className="flex-1 overflow-y-auto">
        {mode === "create" && (
          <div className="mx-4 mt-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t("new_account") || "New account"}
            </p>
            <AccountForm
              onSubmit={handleCreate}
              onCancel={cancelForm}
              submitting={submitting}
            />
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-[var(--hvsna-primary-color)] rounded-full animate-spin" />
          </div>
        ) : accounts.length === 0 && mode !== "create" ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="text-4xl mb-3">🏦</div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("no_accounts_yet") || "No accounts yet"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {t("no_accounts_description") || "Add accounts like Cash, Bank, or Card"}
            </p>
            <button
              onClick={() => setMode("create")}
              className="mt-4 px-4 py-2 rounded-lg bg-[var(--hvsna-primary-color)] text-white text-sm font-medium"
            >
              {t("add_account") || "Add account"}
            </button>
          </div>
        ) : (
          <div className="mt-4 mx-4 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
            {accounts.map((account) =>
              mode === "edit" && editingAccount?.id === account.id ? (
                <div
                  key={account.id}
                  className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700"
                >
                  <AccountForm
                    initial={{ name: account.name, icon: account.icon }}
                    onSubmit={handleUpdate}
                    onCancel={cancelForm}
                    submitting={submitting}
                  />
                </div>
              ) : (
                <AccountRow
                  key={account.id}
                  account={account}
                  onEdit={startEdit}
                  onDelete={handleDelete}
                />
              )
            )}
          </div>
        )}
      </div>
    </Page>
  );
}
