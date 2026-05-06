import { useState, useEffect, useMemo } from "react";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useTrackerEvaluations } from "./use-tracker-evaluations";
import { useTrackers } from "./use-trackers";
import type {
  EvaluationConfig,
  InputMode,
  ToggleMetric,
  AddMetric,
  SetMetric,
  TimeWindow,
  Operator,
} from "../../domain/tracker/ITrackerRepository";
import { HvX } from "../icons";

interface TrackerEvaluationFormProps {
  trackerId: string;
  editing?: EvaluationConfig | null;
  onClose: () => void;
}

function getMetricsForMode(mode: InputMode, t: (key: string) => string) {
  const TOGGLE_METRICS: { value: ToggleMetric; label: string }[] = [
    { value: "count", label: t("metric_count") || "Count" },
    { value: "rate", label: t("metric_rate") || "Rate" },
    { value: "streak", label: t("metric_streak") || "Streak" },
    { value: "latest", label: t("metric_latest") || "Latest" },
    { value: "previous", label: t("metric_previous") || "Previous" },
    { value: "gap", label: t("metric_gap") || "Gap" },
    { value: "consistency", label: t("metric_consistency") || "Consistency" },
  ];

  const ADD_METRICS: { value: AddMetric; label: string }[] = [
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
    {
      value: "distribution",
      label: t("metric_distribution") || "Distribution",
    },
  ];

  const SET_METRICS: { value: SetMetric; label: string }[] = [
    { value: "latest", label: t("metric_latest") || "Latest" },
    { value: "delta", label: t("metric_delta") || "Delta" },
    { value: "trend", label: t("metric_trend") || "Trend" },
    { value: "average", label: t("metric_average") || "Average" },
    { value: "min", label: t("metric_min") || "Min" },
    { value: "max", label: t("metric_max") || "Max" },
    { value: "previous", label: t("metric_previous") || "Previous" },
    { value: "gap", label: t("metric_gap") || "Gap" },
    {
      value: "distribution",
      label: t("metric_distribution") || "Distribution",
    },
  ];

  if (mode === "toggle") return TOGGLE_METRICS;
  if (mode === "add") return ADD_METRICS;
  return SET_METRICS;
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoFocus?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--hvsna-primary-color)] text-sm"
    />
  );
}

export function TrackerEvaluationForm({
  trackerId,
  editing,
  onClose,
}: TrackerEvaluationFormProps) {
  const { t } = useLanguageContext();
  const { data: trackers = [] } = useTrackers();
  const { data: evaluations = [], updateEvaluations } =
    useTrackerEvaluations(trackerId);

  const tracker = trackers.find((t) => t.id === trackerId);
  const inputMode = tracker?.inputMode ?? "toggle";
  const metrics = getMetricsForMode(inputMode, t);

  const [label, setLabel] = useState(editing?.label ?? "");
  const [metric, setMetric] = useState<string>(
    editing?.metric ?? metrics[0]?.value ?? "count"
  );
  const [window, setWindow] = useState<TimeWindow>(editing?.window ?? "today");
  const [operator, setOperator] = useState<Operator | undefined>(
    editing?.operator
  );
  const [target, setTarget] = useState(editing?.target?.toString() ?? "");
  const [labelError, setLabelError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editing) {
      setLabel(editing.label ?? "");
      setMetric(editing.metric as string);
      setWindow(editing.window);
      setOperator(editing.operator);
      setTarget(editing.target?.toString() ?? "");
    }
  }, [editing?.id]);

  const handleSave = async () => {
    const trimmedLabel = label.trim();
    if (!trimmedLabel && !metric) {
      setLabelError(t("evaluation_label_required") || "Label is required");
      return;
    }
    setSubmitting(true);
    try {
      const evaluation: EvaluationConfig = {
        id: editing?.id ?? crypto.randomUUID(),
        metric: metric as any,
        window,
        label: trimmedLabel || undefined,
        operator: operator || undefined,
        target: target ? parseFloat(target) : undefined,
      };

      let nextEvaluations: EvaluationConfig[];
      if (editing?.id) {
        nextEvaluations = evaluations.map((e) =>
          e.id === editing.id ? evaluation : e
        );
      } else {
        nextEvaluations = [...evaluations, evaluation];
      }

      await updateEvaluations(trackerId, nextEvaluations);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const windowOptions: { value: TimeWindow; label: string }[] = [
    { value: "today", label: t("window_today") || "Today" },
    { value: "7d", label: t("window_7d") || "7 days" },
    { value: "30d", label: t("window_30d") || "30 days" },
  ];

  const operatorOptions: { value: Operator; label: string }[] = [
    { value: ">=", label: ">=" },
    { value: "<=", label: "<=" },
    { value: ">", label: ">" },
    { value: "<", label: "<" },
    { value: "==", label: "=" },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          {editing
            ? t("evaluation_edit") || "Edit Evaluation"
            : t("evaluation_new") || "New Evaluation"}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <HvX size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Label */}
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">
            {t("evaluation_label") || "Label"}
          </label>
          <TextInput
            value={label}
            onChange={(v) => {
              setLabel(v);
              setLabelError(null);
            }}
            placeholder="e.g. Daily steps goal..."
            autoFocus={!editing}
          />
          {labelError && (
            <p className="mt-1.5 text-xs text-[var(--hvsna-danger-color)]">
              {labelError}
            </p>
          )}
        </div>

        {/* Metric */}
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            {t("evaluation_metric") || "Metric"}
          </p>
          <div className="flex gap-2 flex-wrap">
            {metrics.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMetric(opt.value)}
                className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  metric === opt.value
                    ? "border-[var(--hvsna-primary-color)] bg-[var(--hvsna-primary-color)]/10 text-[var(--hvsna-primary-color)]"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Window */}
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            {t("evaluation_window") || "Window"}
          </p>
          <div className="flex gap-2">
            {windowOptions.map((opt) => (
              <button
                key={opt.value as string}
                type="button"
                onClick={() => setWindow(opt.value)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  window === opt.value
                    ? "border-[var(--hvsna-primary-color)] bg-[var(--hvsna-primary-color)]/10 text-[var(--hvsna-primary-color)]"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Comparison (optional) */}
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            {t("evaluation_comparison") || "Comparison (optional)"}
          </p>
          <div className="flex gap-2">
            {operatorOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  setOperator(operator === opt.value ? undefined : opt.value)
                }
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  operator === opt.value
                    ? "border-[var(--hvsna-primary-color)] bg-[var(--hvsna-primary-color)]/10 text-[var(--hvsna-primary-color)]"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Target */}
        {operator && (
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">
              {t("evaluation_target") || "Target value"}
            </label>
            <TextInput
              type="number"
              value={target}
              onChange={setTarget}
              placeholder="e.g. 10000"
            />
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={submitting}
          className="w-full py-2.5 rounded-lg bg-[var(--hvsna-primary-color)] text-white text-sm font-medium disabled:opacity-50 transition-opacity"
        >
          {submitting ? "..." : t("save") || "Save"}
        </button>
      </div>
    </div>
  );
}

export default TrackerEvaluationForm;
