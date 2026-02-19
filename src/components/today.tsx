import { useTask } from "../modules/task/use-task";
import type { Log } from "src/modules/tracker/types";
import type { AttributeOption } from "../modules/option/optionStore";
import type { TrackerAttribute } from "../modules/attribute/trackerAttributeStore";
import { Page } from "../modules/navigation";
import Block from "./block";
import BlockTitle from "./block-title";
import type { Tracker } from "../modules/tracker/trackerStore";
import TaskListItem from "./task-list-item";
import { formatValue } from "src/lib/format";
import { useToday } from "src/hooks/use-today";
import { LargeNavbar } from "src/modules/navigation/navbar";
import { useLanguageContext } from "../modules/common/LanguageContext";
import type { Task } from "src/modules/task/types";
import type { TargetResultData } from "src/modules/goal/useTargetResults";

interface TodayTasksProps {
  tasks: Task[];
}

function TodayTasks({ tasks }: TodayTasksProps) {
  const { openTaskForm } = useTask();

  const handleEditTask = (task: Task) => {
    openTaskForm(task.id);
  };

  return (
    <>
      {tasks.map((task) => (
        <TaskListItem
          key={task.id}
          task={task}
          onEdit={handleEditTask}
          showGoalInfo={false}
          className="transition-all hover:shadow-sm"
          showDateTime={true}
        />
      ))}
    </>
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
  const { t } = useLanguageContext();

  if (results.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-2">{t("no_targets_found")}</div>
        <div className="text-gray-500 text-sm">
          {t("create_targets_to_see_progress")}
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
            {t("showing_x_of_y_targets", {
              first: "6",
              total: results.length.toString(),
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function Today() {
  const { t } = useLanguageContext();
  const {
    targetResults,
    todayTasks,
    loading,
    initiated,
    error,
    pageTitle,
    subTitle,
  } = useToday();

  if (initiated && error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 font-medium">{t("error")}</div>
          <div className="text-red-600 text-sm mt-1">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <Page>
      <LargeNavbar title={pageTitle} subtitle={subTitle} />

      {/* Target Results Summary */}
      {targetResults.length > 0 && (
        <Block>
          <BlockTitle extra={t("summary")}>
            {t("where_am_i_right_now")}
          </BlockTitle>
          <TargetResultsOverview results={targetResults} />
        </Block>
      )}

      {initiated && todayTasks.length === 0 && (
        <div className="p-4">
          <div className="text-gray-400 mb-2">
            {t("no_tasks_scheduled_for_today")}
          </div>
          <div className="text-gray-500 text-sm">
            {t("tasks_scheduled_for_today_will_appear_here")}
          </div>
        </div>
      )}

      <TodayTasks tasks={todayTasks} />
    </Page>
  );
}
