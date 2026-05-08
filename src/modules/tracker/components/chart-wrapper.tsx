import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TrackerLog } from "../../../domain/tracker/TrackerLog";

export type ChartType = "toggle" | "add" | "set";

interface TrackerChartProps {
  logs: TrackerLog[];
  inputMode: ChartType;
  unit?: string;
}

interface ToggleDataPoint {
  date: string;
  count: number;
}

interface ValueDataPoint {
  date: string;
  value: number;
}

// Abstraction interface for chart library
// This allows easy replacement of the underlying chart library in the future
export function TrackerChart({ logs, inputMode, unit }: TrackerChartProps) {
  // Process data based on input mode
  const processToggleData = (): ToggleDataPoint[] => {
    if (logs.length === 0) return [];

    const sortedLogs = [...logs].sort((a, b) => a.occurredAt - b.occurredAt);
    const dateMap = new Map<string, number>();
    sortedLogs.forEach((log) => {
      const date = new Date(log.occurredAt).toLocaleDateString();
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });

    return Array.from(dateMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));
  };

  const processAddData = (): ValueDataPoint[] => {
    if (logs.length === 0) return [];

    const sortedLogs = [...logs].sort((a, b) => a.occurredAt - b.occurredAt);
    let cumulative = 0;
    return sortedLogs.map((log) => {
      cumulative += log.value;
      return {
        date: new Date(log.occurredAt).toLocaleDateString(),
        value: cumulative,
      };
    });
  };

  const processSetData = (): ValueDataPoint[] => {
    if (logs.length === 0) return [];

    const sortedLogs = [...logs].sort((a, b) => a.occurredAt - b.occurredAt);
    return sortedLogs.map((log) => ({
      date: new Date(log.occurredAt).toLocaleDateString(),
      value: log.value,
    }));
  };

  if (logs.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
        No data to display
      </div>
    );
  }

  // Render appropriate chart type based on inputMode
  if (inputMode === "toggle") {
    const data = processToggleData();
    if (data.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          No data to display
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={256}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis
            dataKey="date"
            className="text-gray-600 dark:text-gray-400 text-xs"
          />
          <YAxis className="text-gray-600 dark:text-gray-400 text-xs" />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--tw-gray-50, #f9fafb)",
              border: "1px solid var(--tw-gray-200, #e5e7eb)",
              borderRadius: "8px",
            }}
          />
          <Bar
            dataKey="count"
            fill="var(--hvsna-primary-color)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // For "add" and "set" modes, use line chart
  const data = inputMode === "add" ? processAddData() : processSetData();
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
        No data to display
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={256}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
        <XAxis
          dataKey="date"
          className="text-gray-600 dark:text-gray-400 text-xs"
        />
        <YAxis className="text-gray-600 dark:text-gray-400 text-xs" />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--tw-gray-50, #f9fafb)",
            border: "1px solid var(--tw-gray-200, #e5e7eb)",
            borderRadius: "8px",
          }}
          formatter={(value: any) => [value, unit ? `${value} ${unit}` : value]}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="var(--hvsna-primary-color)"
          strokeWidth={2}
          dot={{ fill: "var(--hvsna-primary-color)", strokeWidth: 2, r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
