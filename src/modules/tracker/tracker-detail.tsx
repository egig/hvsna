import React, { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useTrackers } from "./use-trackers";
import { useTrackerLogs } from "./use-tracker-logs";
import { useTrackerStats } from "./use-tracker-stats";
import { TrackerProvider, useTrackerContext } from "./tracker-context";
import { TrackerForm } from "./tracker-form";
import { Navbar } from "../navigation/navbar";
import { Modal } from "../navigation/modal";
import { Page } from "../navigation";
import { NavActionButton } from "../components/nav-action-button";
import { EmptyState } from "../components/empty-state";
import { HvEdit2, HvTrash2, HvPlus, HvX } from "../icons";
import { gregorianToHijri } from "@tabby_ai/hijri-converter";
import { formatHijriDateString, parseHijriDateString } from "../task/task-form-helpers";
import type { TrackerLog, TrackerEvalStatus } from "../../domain/tracker/ITrackerRepository";

const STATUS_LABEL: Record<TrackerEvalStatus, string> = {
  on_track: "On Track",
  at_risk: "At Risk",
  off_track: "Off Track",
  achieved: "Achieved",
  failed: "Failed",
};

const STATUS_COLOR: Record<TrackerEvalStatus, string> = {
  on_track: "#22c55e",
  at_risk: "#f97316",
  off_track: "#ef4444",
  achieved: "#22c55e",
  failed: "#ef4444",
};

const GOAL_TYPES = new Set(["habit", "build_up", "cut_down", "target", "range"]);

function timestampToHijriStr(ts: number): string {
  const d = new Date(ts);
  const h = gregorianToHijri({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() });
  return formatHijriDateString(h.year, h.month, h.day);
}

function formatHijriKey(dateHijri: string): string {
  try {
    const { year, month, day } = parseHijriDateString(dateHijri);
    return `${day}/${month}/${year} H`;
  } catch {
    return dateHijri;
  }
}

/** Returns today's date as a "YYYY-MM-DD" string for <input type="date"> */
function todayGregorianStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Converts a "YYYY-MM-DD" string to a local-midnight timestamp */
function dateStrToTimestamp(str: string): number {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}

function groupLogsByDate(logs: TrackerLog[]): Map<string, TrackerLog[]> {
  const groups = new Map<string, TrackerLog[]>();
  for (const log of logs) {
    const ts = log.occurredAt ?? log.createdAt ?? 0;
    const key = ts > 0 ? timestampToHijriStr(ts) : "unknown";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(log);
  }
  return groups;
}

interface LogFormProps {
  trackerType: string;
  trackerUnit?: string;
  defaultOccurredAt?: number;
  initialValue?: string;
  initialNote?: string;
  onClose: () => void;
  onSubmit: (value: number, note: string, occurredAt: number) => Promise<void>;
}

function LogForm({ trackerType, trackerUnit, defaultOccurredAt, initialValue, initialNote, onClose, onSubmit }: LogFormProps) {
  const { t } = useLanguageContext();
  const [value, setValue] = useState(initialValue ?? "1");
  const [note, setNote] = useState(initialNote ?? "");
  const [occurDate, setOccurDate] = useState(() => {
    const ts = defaultOccurredAt ?? Date.now();
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setError("Enter a valid number");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const occurredAt = dateStrToTimestamp(occurDate);
      await onSubmit(numValue, note.trim(), occurredAt);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const isBooleanType = trackerType === "binary" || trackerType === "habit";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          {t("log_value") || "Log"}
        </h2>
        <button type="button" onClick={onClose} className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
          <HvX size={18} />
        </button>
      </div>

      <div className="px-4 py-4 space-y-4">
        {error && <p className="text-sm text-[var(--hvsna-danger-color)]">{error}</p>}

        {isBooleanType ? (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setValue("1")}
              className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-colors ${
                value === "1"
                  ? "border-[var(--hvsna-primary-color)] bg-[var(--hvsna-primary-color)]/10 text-[var(--hvsna-primary-color)]"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
              }`}
            >
              {t("yes") || "Yes"}
            </button>
            <button
              type="button"
              onClick={() => setValue("-1")}
              className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-colors ${
                value === "-1"
                  ? "border-[var(--hvsna-danger-color)] bg-[var(--hvsna-danger-color)]/10 text-[var(--hvsna-danger-color)]"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
              }`}
            >
              {t("log_undo") || "Undo / No"}
            </button>
          </div>
        ) : trackerType === "tally" ? (
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setValue(String(parseInt(value || "0") - 1))}
              className="w-12 h-12 rounded-full border border-gray-200 dark:border-gray-700 text-xl font-bold text-gray-600 dark:text-gray-300 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              −
            </button>
            <div className="flex-1 text-center">
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-20 text-center text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-b-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-[var(--hvsna-primary-color)] pb-1"
              />
              {trackerUnit && <p className="text-xs text-gray-400 mt-1">{trackerUnit}</p>}
            </div>
            <button
              type="button"
              onClick={() => setValue(String(parseInt(value || "0") + 1))}
              className="w-12 h-12 rounded-full border-2 text-xl font-bold text-white flex items-center justify-center transition-colors bg-[var(--hvsna-primary-color)] border-[var(--hvsna-primary-color)]"
            >
              +
            </button>
          </div>
        ) : (
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">
              {t("value_label") || "Value"} {trackerUnit && `(${trackerUnit})`}
            </label>
            <input
              type="number"
              step="any"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--hvsna-primary-color)] text-sm"
            />
          </div>
        )}

        <div>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("log_note_placeholder") || "Note (optional)"}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--hvsna-primary-color)] text-sm"
          />
        </div>

        {/* Occurrence date */}
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">
            {t("log_occurred_at") || "Occurrence date"}
          </label>
          <input
            type="date"
            value={occurDate}
            onChange={(e) => setOccurDate(e.target.value)}
            max={todayGregorianStr()}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--hvsna-primary-color)] text-sm"
          />
        </div>
      </div>

      <div className="px-4 pb-4">
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-50 transition-opacity bg-[var(--hvsna-primary-color)]"
        >
          {submitting ? "..." : t("log_value") || "Log"}
        </button>
      </div>
    </form>
  );
}

function TrackerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguageContext();
  const { data: trackers = [], deleteTracker } = useTrackers();
  const { formOpen, editingTrackerId, openEditForm, closeForm } = useTrackerContext();

  const { data: logs = [], isLoading: logsLoading, createLog, updateLog, deleteLog } = useTrackerLogs(id!);
  const { data: stats } = useTrackerStats(id!, Date.now());
  const tracker = trackers.find((t) => t.id === id);

  const [logFormOpen, setLogFormOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<TrackerLog | null>(null);

  if (!tracker) {
    return (
      <Page navbar={<Navbar title="Tracker" />}>
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-[var(--hvsna-primary-color)] rounded-full animate-spin" />
        </div>
      </Page>
    );
  }

  const isGoalType = GOAL_TYPES.has(tracker.type ?? "");

  const handleDelete = async () => {
    if (!confirm(t("delete_tracker_confirm") || "Delete this tracker and all its logs?")) return;
    await deleteTracker(tracker.id!);
    navigate("/tracks");
  };

  const handleLogSubmit = async (value: number, note: string, occurredAt: number) => {
    await createLog({ trackerId: id!, value, note: note || undefined, occurredAt });
  };

  const handleEditLogSubmit = async (value: number, note: string, occurredAt: number) => {
    if (!editingLog?.id) return;
    await updateLog(editingLog.id, { value, note: note || undefined, occurredAt });
  };

  const handleDeleteLog = async (logId: string) => {
    if (!confirm(t("delete_log") || "Delete this log entry?")) return;
    await deleteLog(logId);
  };

  const sortedLogs = [...logs].sort((a, b) => (b.occurredAt ?? b.createdAt ?? 0) - (a.occurredAt ?? a.createdAt ?? 0));
  const grouped = groupLogsByDate(sortedLogs);
  const groupKeys = Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a));

  const progress = isGoalType && stats?.currentScore !== undefined
    ? Math.min(100, Math.max(0, stats.currentScore))
    : undefined;

  const getStatDisplay = () => {
    if (!stats) return null;
    if (tracker.type === "binary" || tracker.type === "habit") {
      return (
        <>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t("stat_today") || "Today"}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.lastValue === null ? "–" : stats.lastValue > 0 ? t("yes") || "Yes" : t("no_label") || "No"}
            </p>
          </div>
          {tracker.type === "habit" && stats?.currentStreak !== undefined && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Streak</p>
              <p className="text-2xl font-bold text-orange-500">🔥 {stats.currentStreak}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t("stat_count") || "Entries"}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.count}</p>
          </div>
        </>
      );
    }
    return (
      <>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("stat_today") || "Today"} {tracker.unit ? `(${tracker.unit})` : ""}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.todayTotal}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("stat_total") || "Total"} {tracker.unit ? `(${tracker.unit})` : ""}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t("stat_count") || "Entries"}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.count}</p>
        </div>
      </>
    );
  };

  const formatLogValue = (log: TrackerLog) => {
    if (tracker.type === "binary" || tracker.type === "habit") {
      return log.value! > 0 ? t("yes") || "Yes" : t("log_undo") || "Undo";
    }
    const prefix = (log.value ?? 0) > 0 ? "+" : "";
    return `${prefix}${log.value}${tracker.unit ? ` ${tracker.unit}` : ""}`;
  };

  return (
    <Page
      navbar={
        <Navbar
          title={tracker.name}
          rightAction={
            <div className="flex items-center gap-1">
              <NavActionButton
                variant="neutral"
                onClick={() => openEditForm(tracker.id!)}
                aria-label={t("edit_tracker") || "Edit"}
              >
                <HvEdit2 size={18} />
              </NavActionButton>
              <NavActionButton
                variant="neutral"
                onClick={handleDelete}
                aria-label={t("delete_tracker") || "Delete"}
              >
                <HvTrash2 size={18} />
              </NavActionButton>
            </div>
          }
        />
      }
    >
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Stats card */}
        <div className="mx-4 mt-4 mb-2 rounded-xl bg-gray-50 dark:bg-gray-800 p-4">
          <div className="flex justify-between items-start gap-4 flex-wrap">
            {getStatDisplay()}
          </div>

          {/* Goal status + progress */}
          {isGoalType && (
            <div className="mt-4">
              {stats?.currentStatus && (
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: STATUS_COLOR[stats.currentStatus] + "22",
                      color: STATUS_COLOR[stats.currentStatus],
                    }}
                  >
                    {STATUS_LABEL[stats.currentStatus]}
                  </span>
                  {progress !== undefined && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">{progress}%</span>
                  )}
                </div>
              )}
              {progress !== undefined && (
                <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: stats?.currentStatus
                        ? STATUS_COLOR[stats.currentStatus]
                        : "var(--hvsna-primary-color)",
                    }}
                  />
                </div>
              )}
              {tracker.targetValue && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Goal: {tracker.targetValue} {tracker.unit ?? ""}
                  {tracker.frequency ? ` / ${tracker.frequency}` : ""}
                </p>
              )}
              {tracker.endDateHijri && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Deadline: {formatHijriKey(tracker.endDateHijri)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Log history */}
        <div className="mt-4">
          <div className="px-4 py-1.5">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t("log_history") || "History"}
            </span>
          </div>

          {logsLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-[var(--hvsna-primary-color)] rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              icon={<div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-700" />}
              title={t("no_logs_yet") || "No logs yet"}
              description={t("no_logs_description") || "Tap the button below to log your first entry"}
            />
          ) : (
            <div className="mt-1">
              {groupKeys.map((dateKey) => (
                <div key={dateKey} className="mb-2">
                  <div className="px-4 py-1.5 bg-gray-50 dark:bg-gray-800/50">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {formatHijriKey(dateKey)}
                    </span>
                  </div>
                  <div>
                    {grouped.get(dateKey)!.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 last:border-0"
                      >
                        <div
                          className="w-1 self-stretch rounded-full flex-shrink-0 bg-gray-300 dark:bg-gray-600"
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-base font-semibold"
                            style={{ color: (log.value ?? 0) < 0 ? "var(--hvsna-danger-color)" : "inherit" }}
                          >
                            {formatLogValue(log)}
                          </p>
                          {log.note && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                              {log.note}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            {log.occurredAt
                              ? new Date(log.occurredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                              : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 -mr-1">
                          <button
                            onClick={() => setEditingLog(log)}
                            className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-[var(--hvsna-primary-color)] rounded transition-colors"
                            title={t("edit_tracker") || "Edit"}
                          >
                            <HvEdit2 size={14} />
                          </button>
                          <button
                            onClick={() => log.id && handleDeleteLog(log.id)}
                            className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-[var(--hvsna-danger-color)] rounded transition-colors"
                            title={t("delete_log") || "Delete log"}
                          >
                            <HvTrash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Log FAB */}
      <button
        onClick={() => setLogFormOpen(true)}
        className="absolute bottom-[calc(var(--tab-bar-height,56px)+1rem+env(safe-area-inset-bottom))] right-[1rem] w-14 h-14 text-white rounded-full shadow-lg flex items-center justify-center z-50 transition-colors bg-[var(--hvsna-primary-color)]"
        aria-label={t("log_value") || "Log"}
      >
        <HvPlus size={24} />
      </button>

      {/* New log modal */}
      <Modal isOpen={logFormOpen} onClose={() => setLogFormOpen(false)} noPadding>
        <LogForm
          trackerType={tracker.type ?? "tally"}
          trackerUnit={tracker.unit}
          onClose={() => setLogFormOpen(false)}
          onSubmit={handleLogSubmit}
        />
      </Modal>

      {/* Edit log modal */}
      <Modal isOpen={Boolean(editingLog)} onClose={() => setEditingLog(null)} noPadding>
        {editingLog && (
          <LogForm
            trackerType={tracker.type ?? "tally"}
            trackerUnit={tracker.unit}
            defaultOccurredAt={editingLog.occurredAt}
            initialValue={editingLog.value?.toString() ?? "1"}
            initialNote={editingLog.note ?? ""}
            onClose={() => setEditingLog(null)}
            onSubmit={handleEditLogSubmit}
          />
        )}
      </Modal>

      {/* Edit tracker modal */}
      <Modal isOpen={formOpen} onClose={closeForm} noPadding>
        <TrackerForm editingId={editingTrackerId} onClose={closeForm} />
      </Modal>
    </Page>
  );
}

export default function TrackerDetail() {
  return (
    <TrackerProvider>
      <TrackerDetailPage />
    </TrackerProvider>
  );
}
