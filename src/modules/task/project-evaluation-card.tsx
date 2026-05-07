import { useMemo } from "react";
import { useTrackers } from "../tracker/use-trackers";
import { useTrackerEvaluationResult } from "../tracker/use-tracker-evaluation-result";
import { useTrackerLastLog } from "../tracker/use-tracker-last-log";
import { EvaluationResultBadge } from "../tracker/evaluation-result-badge";
import { useLanguageContext } from "../i18n/LanguageContext";
import { HvTrash2 } from "@/modules/icons";
import type { TrackerEvaluationRef } from "./types";

function formatRelativeTime(ts: number, t: (key: string) => string): string {
  const now = Date.now();
  const diff = now - ts;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return t("just_now") || "Just now";
  if (minutes < 60) return `${minutes}m ${t("ago") || "ago"}`;
  if (hours < 24) return `${hours}h ${t("ago") || "ago"}`;
  if (days === 1) return t("yesterday") || "Yesterday";
  if (days < 7) return `${days}d ${t("ago") || "ago"}`;
  if (days < 30) return `${Math.floor(days / 7)}w ${t("ago") || "ago"}`;
  return `${Math.floor(days / 30)}mo ${t("ago") || "ago"}`;
}

interface ProjectEvaluationCardProps {
  ref: TrackerEvaluationRef;
  onRemove: () => void;
}

export function ProjectEvaluationCard({ ref, onRemove }: ProjectEvaluationCardProps) {
  const { t } = useLanguageContext();
  const { data: trackers = [] } = useTrackers();

  const tracker = useMemo(
    () => trackers.find((t) => t.id === ref.trackerId),
    [trackers, ref.trackerId]
  );

  const evaluation = useMemo(
    () => tracker?.evaluations?.find((e) => e.id === ref.evaluationId),
    [tracker, ref.evaluationId]
  );

  const { data: result } = useTrackerEvaluationResult(
    ref.trackerId,
    ref.evaluationId,
    Date.now()
  );

  const { data: lastLog } = useTrackerLastLog(ref.trackerId);

  const lastUpdatedAt = lastLog?.occurredAt ?? lastLog?.createdAt ?? null;

  if (!tracker || !evaluation) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-900 opacity-60">
        <p className="text-xs text-gray-500">{t("loading") || "Loading..."}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-900 relative">
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 p-1 text-gray-300 dark:text-gray-600 hover:text-[var(--hvsna-danger-color)] rounded transition-colors"
        title={t("remove") || "Remove"}
      >
        <HvTrash2 size={14} />
      </button>

      <div className="pr-6">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-base">{tracker.emoji || "📊"}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {evaluation.label || evaluation.metric}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">
              {tracker.name}
            </p>
          </div>
        </div>

        <EvaluationResultBadge result={result || null} />

        {lastUpdatedAt && (
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5">
            {t("last_log") || "Last log"}: {formatRelativeTime(lastUpdatedAt, t)}
          </p>
        )}
      </div>
    </div>
  );
}

export default ProjectEvaluationCard;
