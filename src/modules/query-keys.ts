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
  inboxTasks: () => ["inbox-tasks"] as const,
} as const;
