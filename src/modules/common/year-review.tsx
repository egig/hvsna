import { Page } from "../navigation";
import { LargeNavbar } from "../navigation/navbar";
import { useHijriDate } from "../calendar/hijri/use-hijri-date";
import { WeekGrid } from "./week-grid";
import { taskRepository } from "../task/task-repository";
import type { Task } from "../task/types";
import { useState, useEffect } from "react";

export function YearReview() {
  const { currentHijriDate } = useHijriDate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

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

  if (loading) {
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
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading year review...</div>
        </div>
      </Page>
    );
  }

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
        <WeekGrid tasks={tasks} />
      </div>
    </Page>
  );
}
