import { useState, useEffect } from "react";
import { usePouchDB } from "../pouchdb";
import { formatValue } from "src/lib/format";
import { useTargetResults } from "../hooks/useTargetResults";
import { useLogStore } from "../modules/log/logStore";
import { useTrackers } from "../modules/tracker/use-trackers";
import { useTasks } from "../modules/task/use-tasks";
import { LogItem } from "./log-item";
import type { TargetResultData } from "../hooks/useTargetResults";
import type { Log } from "src/lib/tracker/types";
import type { AttributeOption } from "../modules/option/optionStore";
import type { TrackerAttribute } from "../modules/attribute/trackerAttributeStore";
import { useAttributeOptions } from "../modules/option/use-options";
import { useTrackerAttributes } from "../modules/attribute/use-tracker-attributes";
import { Navbar, Page } from "../modules/navigation";
import Block from "./block";
import BlockTitle from "./block-title";
import type { Tracker } from "../modules/tracker/trackerStore";
import type { Task } from "../lib/types/task";
import TaskListItem from "./task-list-item";
import { ClockIcon } from "lucide-react";
import { HijriDate } from "src/lib/hijri";
import {
  GREGORIAN_MONTH_NAMES_EN,
  HIJRI_MONTH_NAMES_EN,
} from "src/lib/hijri-months";

interface TodayTasksProps {
  tasks: Task[];
}

function TodayTasks({ tasks }: TodayTasksProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="text-gray-400 mb-2">No tasks scheduled for today</div>
        <div className="text-gray-500 text-sm">
          Tasks scheduled for today will appear here
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskListItem
          key={task.id}
          task={task}
          showGoalInfo={false}
          className="border rounded-lg transition-all hover:shadow-sm"
        />
      ))}
    </div>
  );
}

interface RecentLogsProps {
  logs: Log[];
  trackers: Tracker[];
  attributeOptions: AttributeOption[];
  trackerAttributes: TrackerAttribute[];
}

interface TargetResultsOverviewProps {
  results: TargetResultData[];
}

function TargetResultsOverview({ results }: TargetResultsOverviewProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-2">No targets found</div>
        <div className="text-gray-500 text-sm">
          Create some targets to see your progress
        </div>
      </div>
    );
  }

  // Show only the first 6 results for overview
  const overviewResults = results.slice(0, 6);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {overviewResults.map((result) => (
          <div
            key={result.targetId}
            className={`border rounded-lg p-4 transition-all hover:shadow-md ${
              result.result === "succeed"
                ? "text-green-600 bg-green-50 border-green-200"
                : result.result === "on-track"
                  ? "text-blue-600 bg-blue-50 border-blue-200"
                  : "text-orange-600 bg-orange-50 border-orange-200"
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-lg truncate flex-1 mr-2">
                {result.targetName}
              </h3>
              <span
                className={`px-2 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                  result.result === "succeed"
                    ? "text-green-600 bg-green-100"
                    : result.result === "on-track"
                      ? "text-blue-600 bg-blue-100"
                      : "text-orange-600 bg-orange-100"
                }`}
              >
                {result.result === "succeed"
                  ? "✓"
                  : result.result === "on-track"
                    ? "→"
                    : "!"}{" "}
              </span>
            </div>

            <div className="xspace-y-2">
              <div className="flex justify-between gap-1">
                <div className="w-[50%] text-[0.6rem]">
                  <div className="">
                    <span className="font-medium ">
                      {formatValue(result.currentValue, result.trackerFormat)}
                    </span>
                    /
                    <span className="font-medium">
                      {formatValue(result.targetValue, result.trackerFormat)}
                      {result.targetMax &&
                        ` - ${formatValue(result.targetMax, result.trackerFormat)}`}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-[2rem] font-bold opacity-60">
                  <span>{Math.round(result.percentage)}%</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      result.result === "succeed"
                        ? "bg-green-600"
                        : result.result === "on-track"
                          ? "bg-blue-600"
                          : "bg-orange-600"
                    }`}
                    style={{ width: `${Math.min(100, result.percentage)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {results.length > 6 && (
        <div className="text-center">
          <div className="text-sm text-gray-500">
            Showing 6 of {results.length} targets
          </div>
        </div>
      )}
    </div>
  );
}

export function Home() {
  const { db } = usePouchDB();
  const { getTargetResults } = useTargetResults();
  const { getLogsFromDB } = useLogStore();
  const { getTrackers } = useTrackers();
  const { getTasksByHijriDate } = useTasks();

  const [targetResults, setTargetResults] = useState<TargetResultData[]>([]);
  const [recentLogs, setRecentLogs] = useState<Log[]>([]);
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { attributeOptions } = useAttributeOptions();
  const { trackerAttributes } = useTrackerAttributes();

  const _hijriDate = HijriDate.fromDate(new Date());
  const [activeDate, setActiveDate] = useState(_hijriDate);
  const gregorianDate = activeDate.toDate();
  const pageTitle = `${activeDate.day} ${HIJRI_MONTH_NAMES_EN[activeDate.month - 1]} ${activeDate.year}`;
  const subTitle = `${activeDate.format("dddd")}, ${gregorianDate.getDate()} ${GREGORIAN_MONTH_NAMES_EN[gregorianDate.getMonth()]} ${gregorianDate.getFullYear()}`;

  useEffect(() => {
    const loadHomeData = async () => {
      if (!db) return;

      try {
        setLoading(true);
        setError(null);

        // Load target results (last 30 days)
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

        // Format today's Hijri date as YYYYMMDD
        const todayHijri = HijriDate.fromDate(new Date());
        const formattedHijriDate = `${todayHijri.year.toString().padStart(4, "0")}${todayHijri.month.toString().padStart(2, "0")}${todayHijri.day.toString().padStart(2, "0")}`;

        const [results, logs, trackersData, tasks] = await Promise.all([
          getTargetResults(
            {
              from: thirtyDaysAgo,
              to: Date.now(),
            },
            db,
          ),
          getLogsFromDB({ limit: 10 }, db),
          getTrackers(),
          getTasksByHijriDate(formattedHijriDate),
        ]);

        setTargetResults(results);
        setRecentLogs(logs);
        setTrackers(trackersData);
        setTodayTasks(tasks);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load home data",
        );
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, [db]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-600">Loading home dashboard...</div>
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

  return (
    <Page>
      <Navbar title={pageTitle} subtitle={subTitle} />

      {/* Target Results Summary */}
      {targetResults.length > 0 && (
        <Block>
          <BlockTitle extra={"Summary"}>Where am I right now</BlockTitle>
          <TargetResultsOverview results={targetResults} />
        </Block>
      )}

      {/* Today's Tasks Section */}
      <Block>
        <BlockTitle extra={<ClockIcon size={16} className="text-blue-500" />}>
          Today's Tasks
        </BlockTitle>
        <TodayTasks tasks={todayTasks} />
      </Block>
    </Page>
  );
}
