import type { Goal } from "./goalStore";
import type {
  TargetResultData,
  TargetResult,
} from "../../hooks/useTargetResults";
import { formatValue } from "src/lib/format";

interface GoalResultItemProps {
  result: TargetResultData;
  onItemClick: (goal: Goal) => void;
}

export function GoalResultItem({ result, onItemClick }: GoalResultItemProps) {
  return (
    <div
      onClick={() => {
        onItemClick(result.goal);
      }}
      className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow cursor-pointer"
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-gray-900 truncate flex-1 mr-2">
          {result.targetName}
        </h3>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            result.result === "succeed"
              ? "bg-green-100 text-green-700"
              : result.result === "on-track"
                ? "bg-blue-100 text-blue-700"
                : "bg-orange-100 text-orange-700"
          }`}
        >
          {result.result}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="text-gray-600">
            {formatValue(result.currentValue, result.trackerFormat)} /{" "}
            {formatValue(result.targetValue, result.trackerFormat)}
          </span>
          <span className="text-gray-500 text-xs">{result.logsUsed} logs</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-20 bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${
                result.result === "succeed"
                  ? "bg-green-600"
                  : result.result === "on-track"
                    ? "bg-blue-600"
                    : "bg-orange-600"
              }`}
              style={{ width: `${Math.min(100, result.percentage)}%` }}
            />
          </div>
          <span className="text-xs text-gray-600 w-8 text-right">
            {Math.round(result.percentage)}%
          </span>
        </div>
      </div>
    </div>
  );
}
