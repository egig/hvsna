import { useMemo } from "react";
import { WeekCard } from "./week-card";
import { useHijriDate } from "../calendar/hijri/use-hijri-date";
import { useDateTranslationHelper } from "../calendar/use-date-translation-helper";
import { Task } from "../task/types";
import { HijriDate } from "../calendar/hijri/hijri-date";

interface WeekGridProps {
  tasks: Task[];
}

interface WeekData {
  weekNumber: number;
  startDate: HijriDate;
  endDate: HijriDate;
  gregorianStart: Date;
  gregorianEnd: Date;
  tasks: Task[];
  isCurrentWeek: boolean;
  monthName: string;
}

export function WeekGrid({ tasks }: WeekGridProps) {
  const { currentHijriDate } = useHijriDate();
  const { hijriMonthNames } = useDateTranslationHelper();

  const weeksData = useMemo(() => {
    const weeks: WeekData[] = [];

    try {
      // Find Ramadan 1st of current Hijri year
      let ramadanStart: Date;
      try {
        // Create Ramadan 1st and convert to Gregorian
        const ramadanHijri = new HijriDate(currentHijriDate.year, 9, 1);
        ramadanStart = ramadanHijri.toDate();
      } catch (error) {
        console.error("Error creating Ramadan date:", error);
        // Fallback to today if Ramadan calculation fails
        ramadanStart = new Date();
      }

      // Generate 52 weeks starting from Ramadan
      for (let i = 0; i < 52; i++) {
        try {
          // Calculate week start (Ramadan + i weeks, then adjust to Friday)
          const weekStart = new Date(ramadanStart);
          weekStart.setDate(ramadanStart.getDate() + i * 7);

          // Adjust to Friday (day 5, where Sunday=0, Friday=5)
          const dayOfWeek = weekStart.getDay();
          const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
          weekStart.setDate(weekStart.getDate() + daysUntilFriday);

          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6); // Friday to Thursday

          // Convert to Hijri dates
          const hijriStart = HijriDate.fromDate(weekStart);
          const hijriEnd = HijriDate.fromDate(weekEnd);

          // Filter tasks for this week
          const weekTasks = tasks.filter((task) => {
            if (!task.atEpochMillis) return false;
            const taskDate = new Date(task.atEpochMillis);
            return taskDate >= weekStart && taskDate <= weekEnd;
          });

          // Check if this is the current week
          const today = new Date();
          const isCurrentWeek = today >= weekStart && today <= weekEnd;

          // Get month name
          const monthName = hijriMonthNames[hijriStart.month - 1] || "Unknown";

          // Add week data
          weeks.push({
            weekNumber: i + 1,
            startDate: hijriStart,
            endDate: hijriEnd,
            gregorianStart: weekStart,
            gregorianEnd: weekEnd,
            tasks: weekTasks,
            isCurrentWeek,
            monthName,
          });
        } catch (weekError) {
          console.error(`Error in week ${i + 1}:`, weekError);
          // Continue with next week
        }
      }
    } catch (error) {
      console.error("Error calculating weeks:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.stack);
      }
      return [];
    }

    return weeks;
  }, [currentHijriDate.year, hijriMonthNames, tasks]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Weekly Overview - Hijri Year {currentHijriDate.year}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Starting from Ramadan • Weeks run Friday to Thursday •{" "}
          {weeksData.length} weeks
        </p>
      </div>

      {/* Error State */}
      {weeksData.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400">
            Unable to load week data. Please try refreshing the page.
          </div>
        </div>
      )}

      {/* Week Grid */}
      {weeksData.length > 0 && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-5">
          {weeksData.map((week) => (
            <WeekCard
              key={`week-${week.weekNumber}`}
              weekNumber={week.weekNumber}
              startDate={week.startDate}
              endDate={week.endDate}
              gregorianStart={week.gregorianStart}
              gregorianEnd={week.gregorianEnd}
              tasks={week.tasks}
              isCurrentWeek={week.isCurrentWeek}
              monthName={week.monthName}
              formatDate={(date, format) => date.format(format)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
