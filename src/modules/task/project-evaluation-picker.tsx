import { useState, useMemo } from "react";
import { useTrackers } from "../tracker/use-trackers";
import { useLanguageContext } from "../i18n/LanguageContext";
import { Modal } from "../navigation/modal";
import { HvX } from "../icons";
import type { Tracker, EvaluationConfig } from "../../domain/tracker/ITrackerRepository";
import type { TrackerEvaluationRef } from "./types";

interface ProjectEvaluationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (refs: TrackerEvaluationRef[]) => void;
  existingRefs: TrackerEvaluationRef[];
}

function getMetricsForMode(mode: string, t: (key: string) => string) {
  const TOGGLE_METRICS: { value: string; label: string }[] = [
    { value: "count", label: t("metric_count") || "Count" },
    { value: "rate", label: t("metric_rate") || "Rate" },
    { value: "streak", label: t("metric_streak") || "Streak" },
    { value: "latest", label: t("metric_latest") || "Latest" },
    { value: "previous", label: t("metric_previous") || "Previous" },
    { value: "gap", label: t("metric_gap") || "Gap" },
    { value: "consistency", label: t("metric_consistency") || "Consistency" },
  ];

  const ADD_METRICS: { value: string; label: string }[] = [
    { value: "sum", label: t("metric_sum") || "Sum" },
    { value: "average", label: t("metric_average") || "Average" },
    { value: "per_day", label: t("metric_per_day") || "Per day" },
    { value: "count", label: t("metric_count") || "Count" },
    { value: "latest", label: t("metric_latest") || "Latest" },
    { value: "previous", label: t("metric_previous") || "Previous" },
    { value: "gap", label: t("metric_gap") || "Gap" },
    { value: "min", label: t("metric_min") || "Min" },
    { value: "max", label: t("metric_max") || "Max" },
    { value: "trend", label: t("metric_trend") || "Trend" },
    { value: "distribution", label: t("metric_distribution") || "Distribution" },
  ];

  const SET_METRICS: { value: string; label: string }[] = [
    { value: "latest", label: t("metric_latest") || "Latest" },
    { value: "delta", label: t("metric_delta") || "Delta" },
    { value: "trend", label: t("metric_trend") || "Trend" },
    { value: "average", label: t("metric_average") || "Average" },
    { value: "min", label: t("metric_min") || "Min" },
    { value: "max", label: t("metric_max") || "Max" },
    { value: "previous", label: t("metric_previous") || "Previous" },
    { value: "gap", label: t("metric_gap") || "Gap" },
    { value: "distribution", label: t("metric_distribution") || "Distribution" },
  ];

  if (mode === "toggle") return TOGGLE_METRICS;
  if (mode === "add") return ADD_METRICS;
  return SET_METRICS;
}

function metricLabel(metric: string, mode: string, t: (key: string) => string) {
  const list = getMetricsForMode(mode, t);
  return list.find((m) => m.value === metric)?.label || metric;
}

function windowLabel(
  window: string | { type: string; from: number; to: number },
  t: (key: string) => string
) {
  if (typeof window === "string") {
    return (
      t(`window_${window}`) ||
      (window === "today"
        ? "Today"
        : window === "7d"
        ? "7 days"
        : window === "30d"
        ? "30 days"
        : window)
    );
  }
  return t("window_custom") || "custom";
}

export function ProjectEvaluationPicker({
  isOpen,
  onClose,
  onConfirm,
  existingRefs,
}: ProjectEvaluationPickerProps) {
  const { t } = useLanguageContext();
  const { data: trackers = [] } = useTrackers();

  const [step, setStep] = useState<"tracker" | "evaluations">("tracker");
  const [selectedTracker, setSelectedTracker] = useState<Tracker | null>(null);
  const [selectedEvalIds, setSelectedEvalIds] = useState<Set<string>>(new Set());

  const existingKeys = useMemo(() => {
    return new Set(existingRefs.map((r) => `${r.trackerId}:${r.evaluationId}`));
  }, [existingRefs]);

  const reset = () => {
    setStep("tracker");
    setSelectedTracker(null);
    setSelectedEvalIds(new Set());
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleTrackerSelect = (tracker: Tracker) => {
    setSelectedTracker(tracker);
    setSelectedEvalIds(new Set());
    setStep("evaluations");
  };

  const toggleEval = (evalId: string) => {
    setSelectedEvalIds((prev) => {
      const next = new Set(prev);
      if (next.has(evalId)) next.delete(evalId);
      else next.add(evalId);
      return next;
    });
  };

  const handleConfirm = () => {
    if (!selectedTracker) return;
    const newRefs: TrackerEvaluationRef[] = [];
    selectedEvalIds.forEach((evalId) => {
      const key = `${selectedTracker.id}:${evalId}`;
      if (!existingKeys.has(key)) {
        newRefs.push({ trackerId: selectedTracker.id!, evaluationId: evalId });
      }
    });
    onConfirm(newRefs);
    handleClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} noPadding>
      <div className="flex flex-col h-full max-h-[80vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {step === "tracker"
              ? t("select_tracker") || "Select Tracker"
              : `${selectedTracker?.name || ""} — ${
                  t("select_evaluations") || "Select Evaluations"
                }`}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <HvX size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {step === "tracker" ? (
            <div className="space-y-2">
              {trackers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  {t("no_trackers") || "No trackers available"}
                </p>
              ) : (
                trackers.map((tracker) => (
                  <button
                    key={tracker.id}
                    onClick={() => handleTrackerSelect(tracker)}
                    className="w-full text-left px-3 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{tracker.emoji || "📊"}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {tracker.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {tracker.evaluations?.length || 0}{" "}
                          {t("evaluations") || "evaluations"}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => setStep("tracker")}
                className="text-xs text-[var(--hvsna-primary-color)] font-medium mb-2"
              >
                ← {t("back") || "Back"}
              </button>

              {(selectedTracker?.evaluations || []).map((evalConfig) => {
                const isSelected = selectedEvalIds.has(evalConfig.id);
                const key = `${selectedTracker!.id}:${evalConfig.id}`;
                const alreadyLinked = existingKeys.has(key);

                return (
                  <button
                    key={evalConfig.id}
                    onClick={() => !alreadyLinked && toggleEval(evalConfig.id)}
                    disabled={alreadyLinked}
                    className={`w-full text-left px-3 py-3 rounded-lg border transition-colors ${
                      alreadyLinked
                        ? "border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed"
                        : isSelected
                        ? "border-[var(--hvsna-primary-color)] bg-[var(--hvsna-primary-color)]/10"
                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? "bg-[var(--hvsna-primary-color)] border-[var(--hvsna-primary-color)]"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        {isSelected && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {evalConfig.label || evalConfig.metric}
                          {alreadyLinked && (
                            <span className="ml-1.5 text-xs text-gray-400 font-normal">
                              ({t("already_linked") || "already linked"})
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {metricLabel(
                            evalConfig.metric as string,
                            selectedTracker?.inputMode || "toggle",
                            t
                          )}
                          {" · "}
                          {windowLabel(evalConfig.window, t)}
                          {evalConfig.operator && evalConfig.target !== undefined
                            ? ` · ${evalConfig.operator} ${evalConfig.target}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}

              {(selectedTracker?.evaluations || []).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">
                  {t("no_evaluations_in_tracker") ||
                    "No evaluations in this tracker"}
                </p>
              )}
            </div>
          )}
        </div>

        {step === "evaluations" && selectedEvalIds.size > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={handleConfirm}
              className="w-full py-2.5 rounded-lg bg-[var(--hvsna-primary-color)] text-white text-sm font-medium transition-opacity hover:opacity-90"
            >
              {t("link_selected") || `Link ${selectedEvalIds.size} evaluation${
                selectedEvalIds.size > 1 ? "s" : ""
              }`}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default ProjectEvaluationPicker;
