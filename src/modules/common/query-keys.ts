export const queryKeys = {
  todayTasks: (dateString: string) => ['today-tasks', dateString] as const,
  todayCompletedTasks: (dateString: string) => ['today-completed-tasks', dateString] as const,
  upcomingTasks: (dateString: string) => ['upcoming-tasks', dateString] as const,
  browsedTasks: (filters: string) => ['browsed-tasks', filters] as const,
} as const;
