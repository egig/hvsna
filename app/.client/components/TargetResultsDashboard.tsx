import { useState, useEffect } from "react";
import {
  useTargetResults,
  type TargetResultData,
} from "../hooks/useTargetResults";
import type { TargetResult } from "../hooks/useTargetResults";

interface TargetResultCardProps {
  result: TargetResultData;
}

function TargetResultCard({ result }: TargetResultCardProps) {
  const getStatusColor = (status: TargetResult) => {
    switch (status) {
      case "succeed":
        return "text-green-600 bg-green-50 border-green-200";
      case "on-track":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "exceed":
        return "text-orange-600 bg-orange-50 border-orange-200";
    }
  };

  const getStatusIcon = (status: TargetResult) => {
    switch (status) {
      case "succeed":
        return "✓";
      case "on-track":
        return "→";
      case "exceed":
        return "!";
    }
  };

  const getProgressBarColor = (status: TargetResult) => {
    switch (status) {
      case "succeed":
        return "bg-green-600";
      case "on-track":
        return "bg-blue-600";
      case "exceed":
        return "bg-orange-600";
    }
  };

  return (
    <div
      className={`border rounded-lg p-4 transition-all hover:shadow-md ${getStatusColor(result.result)}`}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-lg truncate flex-1 mr-2">
          {result.targetName}
        </h3>
        <span
          className={`px-2 py-1 rounded-full text-sm font-medium whitespace-nowrap ${getStatusColor(result.result)}`}
        >
          {getStatusIcon(result.result)} {result.result}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm opacity-75">Current</span>
          <span className="font-medium text-lg">{result.currentValue}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm opacity-75">Target</span>
          <span className="font-medium">
            {result.targetValue}
            {result.targetMax && ` - ${result.targetMax}`}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs opacity-60">
            <span>Progress</span>
            <span>{Math.round(result.percentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`${getProgressBarColor(result.result)} h-2 rounded-full transition-all duration-300`}
              style={{ width: `${Math.min(100, result.percentage)}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between text-xs opacity-60 pt-2 border-t border-current/20">
          <span>{result.logsUsed} logs</span>
          <span>
            {result.calculation} • {result.direction}
          </span>
        </div>
      </div>
    </div>
  );
}

interface TargetResultsSummaryProps {
  results: TargetResultData[];
}

export function TargetResultsSummary({ results }: TargetResultsSummaryProps) {
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

interface TargetResultsDashboardProps {
  db: any;
  trackerId?: string;
  targetIds?: string[];
  from?: number;
  to?: number;
}

export function TargetResultsDashboard({
  db,
  trackerId,
  targetIds,
  from,
  to,
}: TargetResultsDashboardProps) {
  const { getTargetResults } = useTargetResults();
  const [results, setResults] = useState<TargetResultData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);
        setError(null);

        const targetResults = await getTargetResults(
          {
            trackerId,
            targetIds,
            from,
            to,
          },
          db,
        );

        setResults(targetResults);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load target results",
        );
      } finally {
        setLoading(false);
      }
    };

    if (db) {
      loadResults();
    }
  }, [getTargetResults, db, trackerId, targetIds, from, to]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-600">Loading target results...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 font-medium">Error</div>
          <div className="text-red-600 text-sm mt-1">{error}</div>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">No targets found</div>
          <div className="text-gray-500 text-sm">
            Try adjusting your filters or create some targets first
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <TargetResultsSummary results={results} />

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Target Results</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("card")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === "card"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Card View
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === "table"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Table View
          </button>
        </div>
      </div>

      {viewMode === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((result) => (
            <TargetResultCard key={result.targetId} result={result} />
          ))}
        </div>
      ) : (
        <TargetResultsTable results={results} />
      )}
    </div>
  );
}

interface TargetResultsTableProps {
  results: TargetResultData[];
}

function TargetResultsTable({ results }: TargetResultsTableProps) {
  const getStatusColor = (status: TargetResult) => {
    switch (status) {
      case "succeed":
        return "text-green-600 bg-green-50";
      case "on-track":
        return "text-blue-600 bg-blue-50";
      case "exceed":
        return "text-orange-600 bg-orange-50";
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left p-3 font-medium text-gray-900">
                Target
              </th>
              <th className="text-right p-3 font-medium text-gray-900">
                Current
              </th>
              <th className="text-right p-3 font-medium text-gray-900">
                Target
              </th>
              <th className="text-center p-3 font-medium text-gray-900">
                Status
              </th>
              <th className="text-center p-3 font-medium text-gray-900">
                Progress
              </th>
              <th className="text-center p-3 font-medium text-gray-900">
                Logs
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {results.map((result) => (
              <tr
                key={result.targetId}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="p-3 font-medium text-gray-900">
                  {result.targetName}
                </td>
                <td className="text-right p-3 font-medium">
                  {result.currentValue}
                </td>
                <td className="text-right p-3">
                  {result.targetValue}
                  {result.targetMax && `-${result.targetMax}`}
                </td>
                <td className="text-center p-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.result)}`}
                  >
                    {result.result}
                  </span>
                </td>
                <td className="text-center p-3">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, result.percentage)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 w-10 text-right">
                      {Math.round(result.percentage)}%
                    </span>
                  </div>
                </td>
                <td className="text-center p-3 text-gray-600">
                  {result.logsUsed}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
