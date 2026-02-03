import type { TargetResultData } from "src/hooks/useTargetResults";

interface TargetResultsSummaryProps {
  results: TargetResultData[];
}

export function GoalResultsSummary({ results }: TargetResultsSummaryProps) {
  const stats = {
    total: results.length,
    succeed: results.filter((r) => r.result === "succeed").length,
    onTrack: results.filter((r) => r.result === "on-track").length,
    exceed: results.filter((r) => r.result === "exceed").length,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        <div className="text-sm text-gray-600">Total Targets</div>
      </div>
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <div className="text-2xl font-bold text-green-600">{stats.succeed}</div>
        <div className="text-sm text-green-600">Achieved</div>
      </div>
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="text-2xl font-bold text-blue-600">{stats.onTrack}</div>
        <div className="text-sm text-blue-600">On Track</div>
      </div>
      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
        <div className="text-2xl font-bold text-orange-600">{stats.exceed}</div>
        <div className="text-sm text-orange-600">Exceeded</div>
      </div>
    </div>
  );
}
