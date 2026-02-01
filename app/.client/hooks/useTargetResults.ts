import { useCallback } from "react";
import { useTargetStore } from "../modules/target/targetStore";
import { useLogStore } from "../modules/log/logStore";
import type {
  Target,
  TargetCalculation,
  TargetDirection,
  TargetPeriod,
} from "../modules/target/targetStore";
import type { Log } from "~/lib/tracker/types";
import type { EpochTime } from "~/lib/tracker/types";
import { useTracker } from "../modules/tracker/use-tracker";

export type TargetResult = "on-track" | "succeed" | "exceed";

export interface TargetResultData {
  targetId: string;
  targetName: string;
  currentValue: number;
  targetValue: number;
  targetMax?: number;
  result: TargetResult;
  percentage: number;
  period?: TargetPeriod;
  logsUsed: number;
  calculation: TargetCalculation;
  direction: TargetDirection;
}

export interface TargetResultQuery {
  trackerId?: string;
  targetIds?: string[];
  from?: EpochTime;
  to?: EpochTime;
}

export function useTargetResults() {
  const { getTargetsFromDB } = useTargetStore();
  const { getLogsFromDB } = useLogStore();
  const { getTracker } = useTracker();

  const calculateValue = useCallback(
    (
      logs: Log[],
      calculation: TargetCalculation,
      trackerType: string,
    ): number => {

      function valueSum(sum: number, log: Log) {
          if (log.negative) {
            log.value = -1 * Math.abs(Number(log.value))
          }
          return sum + Number(log.value);
      }

      if (logs.length === 0) return 0;
      if (trackerType === "counter") {
        // counter always has value of 1 in the log
        return logs.reduce(valueSum, 0);
      }

      switch (calculation) {
        case "sum":
          return logs.reduce(valueSum, 0);
        case "last":
          return Number(logs[logs.length - 1]?.value) || 0;
        case "avg":
          return (
            logs.reduce(valueSum, 0) / logs.length
          );
        case "min":
          return Math.min(...logs.map((log) => Number(log.value)));
        case "max":
          return Math.max(...logs.map((log) => Number(log.value)));
        default:
          return 0;
      }
    },
    [],
  );

  const getDateRange = useCallback(
    (
      period: TargetPeriod | undefined,
      to: EpochTime = Date.now(),
    ): { from: EpochTime; to: EpochTime } => {
      const toDate = new Date(to);
      let from: Date;

      switch (period) {
        case "daily":
          from = new Date(
            toDate.getFullYear(),
            toDate.getMonth(),
            toDate.getDate(),
          );
          break;
        case "weekly":
          const dayOfWeek = toDate.getDay();
          from = new Date(toDate.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
          from.setHours(0, 0, 0, 0);
          break;
        case "monthly":
          from = new Date(toDate.getFullYear(), toDate.getMonth(), 1);
          break;
        case "yearly":
          from = new Date(toDate.getFullYear(), 0, 1);
          break;
        case "total":
        case "log":
        default:
          from = new Date(0);
          break;
      }

      return {
        from: from.getTime(),
        to,
      };
    },
    [],
  );

  const calculateTargetResult = useCallback(
    (target: Target, currentValue: number): TargetResult => {
      const { value, valueMax, direction } = target;

      if (target.type === "range" && valueMax !== undefined) {
        if (currentValue < value) return "on-track";
        if (currentValue >= value && currentValue <= valueMax) return "succeed";
        return "exceed";
      }

      switch (direction) {
        case "increase":
          if (currentValue < value) return "on-track";
          if (currentValue === value) return "succeed";
          return "exceed";
        case "decrease":
          if (currentValue > value) return "exceed";
          if (currentValue === value) return "succeed";
          return "on-track";
        case "neutral":
          if (currentValue === value) return "succeed";
          return "on-track";
        default:
          return "on-track";
      }
    },
    [],
  );

  const calculatePercentage = useCallback(
    (target: Target, currentValue: number): number => {
      const { value, valueMax } = target;

      if (target.type === "range" && valueMax !== undefined) {
        const range = valueMax - value;
        if (range === 0) return 100;
        return Math.min(
          100,
          Math.max(0, ((currentValue - value) / range) * 100),
        );
      }

      if (value === 0) return currentValue > 0 ? 100 : 0;
      return Math.min(100, (currentValue / value) * 100);
    },
    [],
  );

  const getTargetResults = useCallback(
    async (
      query: TargetResultQuery = {},
      db: any,
    ): Promise<TargetResultData[]> => {
      if (!db) {
        throw new Error("Database instance is required");
      }

      try {
        const targets = await getTargetsFromDB(
          {
            trackerId: query.trackerId,
            limit: query.targetIds?.length,
          },
          db,
        );

        const filteredTargets = query.targetIds
          ? targets.filter((target: Target) =>
              query.targetIds!.includes(target.id),
            )
          : targets;

        const results: TargetResultData[] = [];

        for (const target of filteredTargets) {
          const dateRange = getDateRange(target.period, query.to);

          const logs = await getLogsFromDB(
            {
              trackerId: target.trackerId,
              from: dateRange.from,
              to: dateRange.to,
            },
            db,
          );

          const tracker = await getTracker(target.trackerId);
          const currentValue = tracker.baseline + calculateValue(
            logs,
            target.calculation,
            tracker.type,
          );
          const result = calculateTargetResult(target, currentValue);
          const percentage = calculatePercentage(target, currentValue);

          results.push({
            targetId: target.id,
            targetName: target.name,
            currentValue,
            targetValue: target.value,
            targetMax: target.valueMax,
            result,
            percentage,
            period: target.period,
            logsUsed: logs.length,
            calculation: target.calculation,
            direction: target.direction,
          });
        }

        return results;
      } catch (error) {
        throw new Error(
          `Failed to get target results: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
    [
      getTargetsFromDB,
      getLogsFromDB,
      getDateRange,
      calculateValue,
      calculateTargetResult,
      calculatePercentage,
    ],
  );

  const getTargetResult = useCallback(
    async (
      targetId: string,
      query: Omit<TargetResultQuery, "targetIds"> = {},
      db: any,
    ): Promise<TargetResultData | null> => {
      const results = await getTargetResults(
        {
          ...query,
          targetIds: [targetId],
        },
        db,
      );

      return results.length > 0 ? results[0] : null;
    },
    [getTargetResults],
  );

  const getResultsByTracker = useCallback(
    async (
      trackerId: string,
      query: Omit<TargetResultQuery, "trackerId"> = {},
      db: any,
    ): Promise<TargetResultData[]> => {
      return getTargetResults(
        {
          ...query,
          trackerId,
        },
        db,
      );
    },
    [getTargetResults],
  );

  return {
    getTargetResults,
    getTargetResult,
    getResultsByTracker,
  };
}
