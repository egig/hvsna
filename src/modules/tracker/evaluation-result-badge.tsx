import { useLanguageContext } from "../i18n/LanguageContext";
import type { EvaluationResult } from "../../domain/tracker/ITrackerRepository";

interface EvaluationResultBadgeProps {
  result: EvaluationResult | null;
  operator?: string;
}

export function EvaluationResultBadge({
  result,
  operator,
}: EvaluationResultBadgeProps) {
  const { t } = useLanguageContext();

  if (!result || result.value === undefined) return null;

  const hasTarget =
    result.target !== undefined &&
    (result.operator !== undefined || operator !== undefined);
  const op = result.operator ?? operator;
  const isPass = result.success;

  return (
    <div className="flex items-baseline gap-2 mt-1">
      <span className="text-lg font-bold text-gray-900 dark:text-white">
        {typeof result.value === "number"
          ? Number.isInteger(result.value)
            ? result.value
            : result.value.toFixed(1)
          : result.value}
      </span>
      {hasTarget && (
        <span className="text-xs text-gray-400">
          {op} {result.target}
        </span>
      )}
      {isPass !== undefined && (
        <span
          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
            isPass ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {isPass ? t("eval_pass") || "Pass" : t("eval_fail") || "Fail"}
        </span>
      )}
    </div>
  );
}
