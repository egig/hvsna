import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useUpcoming } from '../use-upcoming';
import { taskRepository } from '../../task/task-repository';
import { HijriDate } from '../../calendar/hijri';
import type { Task, TaskStatus } from '../../task/types';

// Mock the dependencies
vi.mock('../../task/task-repository');
vi.mock('../../calendar/hijri/use-hijri-date', () => ({
  useHijriDate: () => ({
    getToday: () => new HijriDate(1445, 1, 15),
    getTomorrow: () => new HijriDate(1445, 1, 16),
    toHijriDate: (date: Date) => new HijriDate(1445, 1, 15),
    formatDate: (date: HijriDate, format: string) => '15 Muharram 1445',
    createHijriDate: (year: number, month: number, day: number) => new HijriDate(year, month, day),
  }),
}));

const mockTaskRepository = vi.mocked(taskRepository);

describe('useUpcoming with React Query', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should load upcoming tasks successfully', async () => {
    const mockUpcomingTasks: Task[] = [
      { id: 'task_1', name: 'Upcoming Task 1', status: 0 as TaskStatus, atDateHijri: '14450116' },
      { id: 'task_2', name: 'Upcoming Task 2', status: 0 as TaskStatus, atDateHijri: '14450117' },
    ];

    mockTaskRepository.findTasksAfter.mockResolvedValue(mockUpcomingTasks);

    const { result } = renderHook(() => useUpcoming(), { wrapper });

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.initiated).toBe(false);
    expect(result.current.upcomingTasks).toEqual([]);

    // Wait for queries to complete
    await waitFor(() => {
      expect(result.current.initiated).toBe(true);
    });

    // Check final state
    expect(result.current.upcomingTasks).toEqual(mockUpcomingTasks);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    
    // Verify repository call
    expect(mockTaskRepository.findTasksAfter).toHaveBeenCalled();
  });

  it('should group tasks by time period correctly', async () => {
    const today = new HijriDate(1445, 1, 15);
    const tomorrow = new HijriDate(1445, 1, 16);
    
    const mockTasks: Task[] = [
      { id: 'task_1', name: 'Today Task', status: 0 as TaskStatus, atDateHijri: '14450115' },
      { id: 'task_2', name: 'Tomorrow Task', status: 0 as TaskStatus, atDateHijri: '14450116' },
      { id: 'task_3', name: 'This Week Task', status: 0 as TaskStatus, atDateHijri: '14450120' },
      { id: 'task_4', name: 'Unscheduled Task', status: 0 as TaskStatus },
    ];

    mockTaskRepository.findTasksAfter.mockResolvedValue(mockTasks);

    const { result } = renderHook(() => useUpcoming(), { wrapper });

    await waitFor(() => {
      expect(result.current.initiated).toBe(true);
    });

    const groups = result.current.taskGroups;
    
    // Check grouping
    expect(groups.today).toHaveLength(1);
    expect(groups.today[0].name).toBe('Today Task');
    
    expect(groups.tomorrow).toHaveLength(1);
    expect(groups.tomorrow[0].name).toBe('Tomorrow Task');
    
    expect(groups.unscheduled).toHaveLength(1);
    expect(groups.unscheduled[0].name).toBe('Unscheduled Task');
  });

  it('should handle errors gracefully', async () => {
    const error = new Error('Failed to fetch upcoming tasks');
    mockTaskRepository.findTasksAfter.mockRejectedValue(error);

    const { result } = renderHook(() => useUpcoming(), { wrapper });

    await waitFor(() => {
      expect(result.current.initiated).toBe(true);
    });

    expect(result.current.error).toBe('Failed to fetch upcoming tasks');
    expect(result.current.upcomingTasks).toEqual([]);
  });

  it('should format scheduled dates correctly', async () => {
    const mockTasks: Task[] = [
      { id: 'task_1', name: 'Task with date', status: 0 as TaskStatus, atDateHijri: '14450115' },
      { id: 'task_2', name: 'Task without date', status: 0 as TaskStatus },
    ];

    mockTaskRepository.findTasksAfter.mockResolvedValue(mockTasks);

    const { result } = renderHook(() => useUpcoming(), { wrapper });

    await waitFor(() => {
      expect(result.current.initiated).toBe(true);
    });

    // Test date formatting
    expect(result.current.formatScheduledDate('14450115')).toBe('15 Muharram 1445');
    expect(result.current.formatScheduledDate('')).toBe('No date set');
    expect(result.current.formatScheduledDate(undefined)).toBe('No date set');
  });

  it('should refresh tasks when called', async () => {
    const mockTasks: Task[] = [{ id: 'task_1', name: 'Task 1', status: 0 as TaskStatus }];
    mockTaskRepository.findTasksAfter.mockResolvedValue(mockTasks);

    const { result } = renderHook(() => useUpcoming(), { wrapper });

    await waitFor(() => {
      expect(result.current.initiated).toBe(true);
    });

    // Clear the mock to track new calls
    vi.clearAllMocks();
    
    // Call refresh
    await result.current.refreshTasks();

    // Verify refetch was called
    expect(mockTaskRepository.findTasksAfter).toHaveBeenCalled();
  });
});
