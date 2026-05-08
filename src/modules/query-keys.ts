export const queryKeys = {
  todayTasks: (dateString: string) => ["today-tasks", dateString] as const,
  todayCompletedTasks: (dateString: string) =>
    ["today-completed-tasks", dateString] as const,
  upcomingTasks: (dateString: string) =>
    ["upcoming-tasks", dateString] as const,
  browsedTasks: (filters: string) => ["browsed-tasks", filters] as const,
  projectTasks: (projectId: string) => ["project-tasks", projectId] as const,
  projects: (filters: string) => ["projects", filters] as const,
  project: (id: string) => ["project", id] as const,
  unscheduledTasks: () => ["unscheduled-tasks"] as const,
  allTasks: () => ["all-tasks"] as const,
  trackers: () => ["trackers"] as const,
  trackerLogs: (trackerId: string) => ["tracker-logs", trackerId] as const,
  trackerStats: (trackerId: string) => ["tracker-stats", trackerId] as const,
  trackerLastLog: (trackerId: string) =>
    ["tracker-last-log", trackerId] as const,
} as const;
