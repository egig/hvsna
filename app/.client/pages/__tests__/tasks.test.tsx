import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { f7 } from 'framework7-react';
import Tasks from '../tasks';

// Mock the useTasks hook
vi.mock('../../hooks/useTasks', () => ({
  useTasks: vi.fn(),
}));

// Mock Framework7 components
vi.mock('framework7-react', () => ({
  Page: ({ children }: any) => <div data-testid="page">{children}</div>,
  Navbar: ({ children }: any) => <div data-testid="navbar">{children}</div>,
  NavTitle: ({ children }: any) => <div data-testid="nav-title">{children}</div>,
  NavRight: ({ children }: any) => <div data-testid="nav-right">{children}</div>,
  List: ({ children, mediaList }: any) => <ul data-testid="list" data-media-list={mediaList}>{children}</ul>,
  ListItem: ({ children, title, subtitle, swipeout }: any) => (
    <li data-testid="list-item" data-swipeout={swipeout}>
      <div>{title}</div>
      <div>{subtitle}</div>
      {children}
    </li>
  ),
  Icon: ({ children, ios, md }: any) => <div data-testid="icon" data-ios={ios} data-md={md}>{children}</div>,
  Preloader: () => <div data-testid="preloader">Loading...</div>,
  Block: ({ children, className }: any) => <div data-testid="block" className={className}>{children}</div>,
  Button: ({ children, fill, onClick, disabled }: any) => (
    <button data-testid="button" data-fill={fill} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Popup: ({ opened, onPopupClose, children }: any) => 
    opened ? <div data-testid="popup">{children}</div> : null,
  Sheet: ({ opened, onSheetClose, children }: any) => 
    opened ? <div data-testid="sheet">{children}</div> : null,
  Link: ({ children, onClick, tabLink, href, routeTabId, popupClose }: any) => (
    <a 
      data-testid="link" 
      href={href}
      data-tab-link={tabLink}
      data-route-tab-id={routeTabId}
      data-popup-close={popupClose}
      onClick={onClick}
    >
      {children}
    </a>
  ),
  ListInput: ({ label, type, placeholder, value, onInput, onChange, required, validate }: any) => (
    <div data-testid="list-input">
      <label>{label}</label>
      <input 
        type={type} 
        placeholder={placeholder} 
        value={value}
        onInput={onInput}
        onChange={onChange}
        required={required}
        data-validate={validate}
      />
    </div>
  ),
  f7: {
    dialog: {
      confirm: vi.fn(),
      alert: vi.fn(),
    },
  },
}));

import { useTasks } from '../../hooks/useTasks';
import type { Task } from '../../../lib/types/task';

const mockUseTasks = vi.mocked(useTasks);

describe('Tasks Page', () => {
  const mockTasks: Task[] = [
    {
      id: 'task_1',
      user_id: 'default-user',
      name: 'Test Task 1',
      status: 'pending',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'task_2',
      user_id: 'default-user',
      name: 'Test Task 2',
      status: 'completed',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    },
  ];

  const createMockUseTasks = (overrides: any = {}) => ({
    tasks: mockTasks,
    loading: false,
    loadingMore: false,
    error: null,
    hasMore: true,
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    getTask: vi.fn(),
    getTasks: vi.fn(),
    getTasksByDate: vi.fn(),
    refreshTasks: vi.fn(),
    loadMoreTasks: vi.fn(),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTasks.mockReturnValue(createMockUseTasks());
  });

  it('should render tasks page with task list', () => {
    render(<Tasks />);
    
    expect(screen.getByTestId('page')).toBeInTheDocument();
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('nav-title')).toHaveTextContent('Tasks');
    expect(screen.getByTestId('list')).toBeInTheDocument();
    expect(screen.getAllByTestId('list-item')).toHaveLength(2);
  });

  it('should show loading state', () => {
    mockUseTasks.mockReturnValue(createMockUseTasks({
      tasks: [],
      loading: true,
    }));

    render(<Tasks />);
    
    expect(screen.getByTestId('preloader')).toBeInTheDocument();
    expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
  });

  it('should show empty state when no tasks', () => {
    mockUseTasks.mockReturnValue(createMockUseTasks({
      tasks: [],
      loading: false,
      hasMore: false,
    }));

    render(<Tasks />);
    
    expect(screen.getByText('No tasks yet')).toBeInTheDocument();
    expect(screen.getByText('Create your first task to get started!')).toBeInTheDocument();
  });

  it('should show error state', () => {
    mockUseTasks.mockReturnValue(createMockUseTasks({
      tasks: [],
      loading: false,
      error: 'Failed to load tasks',
      hasMore: false,
    }));

    render(<Tasks />);
    
    expect(screen.getByText('Error: Failed to load tasks')).toBeInTheDocument();
  });


});
