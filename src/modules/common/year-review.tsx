import { Page } from "../navigation";
import { LargeNavbar } from "../navigation/navbar";
import { useHijriDate } from "../calendar/hijri/use-hijri-date";
import { useDateTranslationHelper } from "../calendar/use-date-translation-helper";
import { useMemo, useState, useEffect } from "react";
import { HijriDate } from "../calendar/hijri/hijri-date";
import { taskRepository } from "../task/task-repository";
import type { Task } from "../task/types";

interface MonthGroupProps {
  months: Array<{ index: number; name: string }>;
  tasks: Task[];
  currentHijriDate: HijriDate;
  createHijriDate: (year: number, month: number, day: number) => HijriDate;
  getStartOfWeek: (date: HijriDate) => HijriDate;
}

function MonthGroup({
  months,
  tasks,
  currentHijriDate,
  createHijriDate,
  getStartOfWeek,
}: MonthGroupProps) {
  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden">
      <div className="flex">
        {/* Month Grid */}
        <div className="flex-1">
          {/* Header Row */}
          <div className="grid grid-cols-6 border-b border-gray-200 dark:border-gray-600">
            {months.map((month) => (
              <div
                key={`${month.index}`}
                className="p-2 font-medium text-sm border-gray-200 dark:border-gray-600"
              >
                {month.name}
              </div>
            ))}
          </div>

          {/* Week Rows */}
          {[0, 1, 2, 3, 4].map((weekNum) => (
            <div
              key={`week-${weekNum}`}
              className="grid grid-cols-6 border-b border-gray-200 dark:border-gray-600"
            >
              {months.map((month) => {
                if (weekNum == 4) {
                }

                // Calculate week date range for this month and week
                const firstDay = createHijriDate(
                  currentHijriDate.year,
                  month.index,
                  1,
                );
                const startOfWeek = getStartOfWeek(firstDay);
                const weekStartDate = startOfWeek.toDate();
                const startDate = new Date(weekStartDate);
                startDate.setDate(startDate.getDate() + weekNum * 7);
                const endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + 6);

                // Filter tasks for this specific week
                const weekTasks = tasks.filter((task) => {
                  if (!task.atEpochMillis) return false;
                  const taskDate = new Date(task.atEpochMillis);
                  return taskDate >= startDate && taskDate <= endDate;
                });

                // Check if today is in this week
                const today = new Date();
                const isCurrentWeek = today >= startDate && today <= endDate;

                return (
                  <div
                    key={`${month.index}-week-${weekNum}`}
                    className="p-2 h-28 border-gray-200 dark:border-gray-600 last:border-r-0"
                  >
                    <span
                      className={`text-xs p-1 rounded ${isCurrentWeek ? "text-gray-400 bg-gray-200 dark:bg-gray-700" : "text-gray-400"}`}
                    >
                      W{weekNum + 1}
                    </span>
                    <div className="p-1 space-y-1 overflow-y-auto max-h-full">
                      {weekTasks.length === 0 ? (
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          No tasks
                        </div>
                      ) : (
                        weekTasks
                          .slice(0, 3)
                          .map((task: Task, taskIndex: number) => (
                            <div
                              key={task.id}
                              className="text-xs text-gray-600 dark:text-gray-300 truncate"
                            >
                              {task.name}
                            </div>
                          ))
                      )}
                      {weekTasks.length > 3 && (
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          +{weekTasks.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function YearReview() {
  const { currentHijriDate, getStartOfWeek, getWeekDates, createHijriDate } =
    useHijriDate();
  const { hijriMonthNames } = useDateTranslationHelper();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const yearData = useMemo(() => {
    const currentYear = currentHijriDate.year;

    // Define month groups as requested
    const firstGroup = [
      { index: 9, name: hijriMonthNames[8] }, // Ramadan
      { index: 10, name: hijriMonthNames[9] }, // Shawwal
      { index: 11, name: hijriMonthNames[10] }, // Dhu al-Qidah
      { index: 12, name: hijriMonthNames[11] }, // Dhu al-Hijjah
      { index: 1, name: hijriMonthNames[0] }, // Muharram
      { index: 2, name: hijriMonthNames[1] }, // Safar
    ];

    const secondGroup = [
      { index: 3, name: hijriMonthNames[2] }, // Rabi al-Awwal
      { index: 4, name: hijriMonthNames[3] }, // Rabi al-Thani
      { index: 5, name: hijriMonthNames[4] }, // Jumada al-Awwal
      { index: 6, name: hijriMonthNames[5] }, // Jumada al-Thani
      { index: 7, name: hijriMonthNames[6] }, // Rajab
      { index: 8, name: hijriMonthNames[7] }, // Shaban
    ];

    // Function to get weeks for a month
    const getWeeksForMonth = (monthIndex: number) => {
      const weeks = [];
      // Create a Hijri date for the first day of the month
      const firstDay = createHijriDate(currentYear, monthIndex, 1);
      const startOfWeek = getStartOfWeek(firstDay);

      // Get up to 4 weeks for the month
      for (let weekNum = 0; weekNum < 4; weekNum++) {
        const weekDates = getWeekDates(startOfWeek);
        weeks.push(weekDates);
      }

      return weeks;
    };

    const getWeekTasksForMonth = async (
      monthIndex: number,
      weekNum: number,
    ) => {
      const firstDay = createHijriDate(currentYear, monthIndex, 1);
      const startOfWeek = getStartOfWeek(firstDay);

      // Calculate the start date for the specific week
      const weekStartDate = startOfWeek.toDate();
      const startDate = new Date(weekStartDate);
      startDate.setDate(startDate.getDate() + weekNum * 7);

      // Calculate the end date for the week (7 days later)
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);

      try {
        // Create HijriDate for the end date to use findTasksAfter
        const endHijriDate = new HijriDate(
          endDate.getFullYear(),
          endDate.getMonth() + 1,
          endDate.getDate(),
        );

        // Fetch tasks up to the end of this week
        const weekTasks = await taskRepository.findTasksAfter(endHijriDate);

        // Filter tasks to only include those within this specific week
        return weekTasks.filter((task) => {
          if (!task.atEpochMillis) return false;
          const taskDate = new Date(task.atEpochMillis);
          return taskDate >= startDate && taskDate <= endDate;
        });
      } catch (error) {
        console.error("Error fetching tasks:", error);
        return [];
      }
    };

    return {
      firstGroup,
      secondGroup,
      getWeeksForMonth,
      getWeekTasksForMonth,
    };
  }, [
    currentHijriDate.year,
    hijriMonthNames,
    getStartOfWeek,
    getWeekDates,
    createHijriDate,
  ]);

  // Load all tasks for the year
  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      try {
        const yearStart = new Date(
          currentHijriDate.toDate().getFullYear(),
          0,
          1,
        );
        const yearEnd = new Date(
          currentHijriDate.toDate().getFullYear(),
          11,
          31,
        );

        // Use findBrowsedTasks with atEpochMillis range
        const allTasks = await taskRepository.findBrowsedTasks(
          {
            atEpochMillis: {
              $gte: yearStart.valueOf(),
              $lte: yearEnd.valueOf(),
            },
          },
          0,
          1000,
        ); // Load up to 1000 tasks for the year

        setTasks(allTasks);
      } catch (error) {
        console.error("Error loading tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [currentHijriDate]);

  return (
    <Page
      fluid
      navbarLarge={
        <LargeNavbar
          title="Year Review"
          subtitle={`Hijri Year ${currentHijriDate.year}`}
        />
      }
    >
      <div className="p-4">
        <div className="space-y-8">
          {/* First Month Group: Ramadan to Safar */}
          <MonthGroup
            months={yearData.firstGroup}
            tasks={tasks}
            currentHijriDate={currentHijriDate}
            createHijriDate={createHijriDate}
            getStartOfWeek={getStartOfWeek}
          />

          {/* Second Month Group: Rabi al-Awwal to Shaban */}
          <MonthGroup
            months={yearData.secondGroup}
            tasks={tasks}
            currentHijriDate={currentHijriDate}
            createHijriDate={createHijriDate}
            getStartOfWeek={getStartOfWeek}
          />
        </div>
      </div>
    </Page>
  );
}
