export const queryKeys = {
  pendingTasks: () => ["pending-tasks"] as const,
  todayVirtualTasks: () => ["today-virtual-tasks"] as const,
  virtualTasks: () => ["virtual-tasks"] as const,
  todayTasks: (dateString: string) => ["today-tasks", dateString] as const,
  todayCompletedTasks: (dateString: string) =>
    ["today-completed-tasks", dateString] as const,
  upcomingTasks: (dateString: string) =>
    ["upcoming-tasks", dateString] as const,
  browsedTasks: (filters: string) => ["browsed-tasks", filters] as const,
  unscheduledTasks: () => ["unscheduled-tasks"] as const,
  allTasks: () => ["all-tasks"] as const,
  completedTasks: () => ["completed-tasks"] as const,
} as const;
