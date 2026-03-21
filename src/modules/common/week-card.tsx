import { Task } from "../task/types";
import { HijriDate } from "../calendar/hijri/hijri-date";

interface WeekCardProps {
  weekNumber: number;
  startDate: HijriDate;
  endDate: HijriDate;
  gregorianStart: Date;
  gregorianEnd: Date;
  tasks: Task[];
  isCurrentWeek: boolean;
  monthName: string;
  formatDate: (date: HijriDate, format: string) => string;
}

export function WeekCard({
  weekNumber,
  startDate,
  endDate,
  gregorianStart,
  gregorianEnd,
  tasks,
  isCurrentWeek,
  monthName,
  formatDate,
}: WeekCardProps) {
  // Format Hijri date range
  const hijriRange = `${formatDate(startDate, "D")} - ${formatDate(endDate, "D MMMM")}`;

  // Format Gregorian date range
  const startMonth = gregorianStart.toLocaleDateString("en-US", {
    month: "short",
  });
  const endMonth = gregorianEnd.toLocaleDateString("en-US", { month: "short" });
  const startDay = gregorianStart.toLocaleDateString("en-US", {
    day: "numeric",
  });
  const endDay = gregorianEnd.toLocaleDateString("en-US", { day: "numeric" });

  const gregorianRange =
    startMonth === endMonth
      ? `${startMonth} ${startDay} - ${endDay}`
      : `${startMonth} ${startDay} - ${endMonth} ${endDay}`;

  return (
    <div
      className={`
        bg-white dark:bg-gray-800 border rounded-lg p-3 h-46 flex flex-col
        transition-all duration-200 hover:shadow-md hover:scale-[1.02]
        ${
          isCurrentWeek
            ? "border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-200 dark:ring-primary-800"
            : "border-gray-200 dark:border-gray-600"
        }
      `}
    >
      {/* Header with week number and dates */}
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <span
            className={`
            text-xs font-semibold px-2 py-1 rounded
            ${
              isCurrentWeek
                ? "bg-primary-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            }
          `}
          >
            W{weekNumber}
          </span>
          <div className="space-y-1">
            <div className="text-sm text-right font-medium text-gray-900 dark:text-gray-100">
              {hijriRange}
            </div>
            <div className="text-xs text-right text-gray-500 dark:text-gray-400">
              {gregorianRange}
            </div>
          </div>
        </div>

        {/* Date ranges */}

        {/* Tasks */}
        <div className="mt-auto">
          {tasks.length === 0 ? (
            <div className="text-xs text-gray-400 dark:text-gray-500">
              No tasks
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {tasks.length} task{tasks.length !== 1 ? "s" : ""}
              </div>
              <div className="space-y-0.5 max-h-16 overflow-hidden">
                {tasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="text-xs text-gray-600 dark:text-gray-300 truncate"
                    title={task.name}
                  >
                    • {task.name}
                  </div>
                ))}
              </div>
              {tasks.length > 3 && (
                <button
                  className="text-xs text-gray-600 hover:text-gray-700 dark:hover:text-blue-300 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Show task details modal or navigate to task list filtered by week
                    console.log(
                      `Show ${tasks.length} tasks for week ${weekNumber}`,
                    );
                  }}
                >
                  +{tasks.length - 3} more
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
