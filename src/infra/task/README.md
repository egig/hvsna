# Task Repository Implementations

This directory contains task repository implementations that automatically adapt to the platform using the appropriate PouchDB adapter.

## Available Implementations

### 1. PouchDBTaskRepository

- **Purpose**: Unified implementation that works on both web and native platforms
- **Usage**: Automatically selects the appropriate adapter based on platform
- **Web Platform**: Uses IndexedDB adapter
- **Native Platform**: Uses Cordova SQLite adapter
- **Database**: Single PouchDB instance with platform-optimized storage

### 2. PouchDBProjectepository

- **Purpose**: List management companion to PouchDBTaskRepository
- **Usage**: Handles list operations with the same platform adaptation
- **Web Platform**: Uses IndexedDB adapter
- **Native Platform**: Uses Cordova SQLite adapter

## Usage

### Automatic Platform Detection (Recommended)

```typescript
import { createTaskRepository } from "./infra/task";

// Automatically creates the appropriate repository for the current platform
// Uses SQLite on native platforms, IndexedDB on web
const repository = createTaskRepository("my-app-db");

// Use the repository with renamed methods to avoid conflicts
const task = await repository.createTask({
  name: "New Task",
  description: "Task description",
  status: 0,
});

const list = await repository.createList({
  name: "My List",
  description: "List description",
  color: "#ff0000",
});
```

### Separate Repositories

```typescript
import { createRepositories } from './infra/task';

const { taskRepository, listRepository } = createRepositories('my-app-db');

// Use repositories separately
const task = await taskRepository.create({...});
const list = await listRepository.create({...});
```

### Direct Repository Usage

```typescript
import { PouchDBTaskRepository, PouchDBProjectepository } from "./infra/task";

// The repositories automatically detect platform and use appropriate adapter
const taskRepo = new PouchDBTaskRepository("my-app-db");
const listRepo = new PouchDBProjectepository("my-app-db");
```

### Database Creation

```typescript
import { createDatabase } from "./infra/task";

// Create a database instance with the appropriate adapter
const db = createDatabase("my-app-db");
```

## Platform Detection

The repositories automatically detect the platform and use the optimal adapter:

- **Native Platforms (iOS/Android)**: Cordova SQLite adapter
- **Web Platform**: IndexedDB adapter
- **Fallback**: If SQLite adapter fails to load, falls back to IndexedDB

## Features

All implementations support:

- ✅ Full CRUD operations for tasks and lists
- ✅ Complex querying with Mango queries
- ✅ Pagination support
- ✅ Index-based performance optimization
- ✅ Type-safe interfaces
- ✅ Hijri date support
- ✅ Task status management
- ✅ List-based organization
- ✅ Automatic platform adaptation
- ✅ Shared database instances for consistency

## Performance Considerations

### Native Platform (SQLite)

- **Pros**: Better performance, persistent storage, native optimizations
- **Cons**: Requires native build, larger app size

### Web Platform (IndexedDB)

- **Pros**: No native dependencies, smaller bundle size
- **Cons**: Limited storage quota, browser-dependent performance

## Migration

The repositories share the same interface, making it easy to switch between implementations:

```typescript
// This code works the same on both platforms
const tasks = await repository.findTasksAfter(todayHijri);
const completed = await repository.findTodayCompletedTasks(today);
```

## Interface Conflicts Resolution

To avoid method name conflicts between task and list operations, the combined interface uses renamed methods:

- `create` → `createTask` / `createList`
- `update` → `updateTask` / `updateList`
- `delete` → `deleteTask` / `deleteList`
- `findById` → `findTaskById` / `findListById`
- `find` → `findTasks` / `findLists`
- `findWithPagination` → `findTasksWithPagination` / `findListsWithPagination`

## Testing

For testing, you can use the web implementation or create a mock repository:

```typescript
// Test with web implementation
const testRepo = new PouchDBTaskRepository("test-db");

// Or create a mock
const mockRepo = {
  createTask: vi.fn(),
  updateTask: vi.fn(),
  // ... other methods
} as ITaskAndListRepository;
```

## Capacitor SQLite Setup

For native platforms, ensure the Cordova SQLite adapter is installed:

```bash
npm install pouchdb-adapter-cordova-sqlite
```

The repositories will automatically:

1. Detect if running on a native platform
2. Load and register the SQLite adapter
3. Create appropriate database instances
4. Initialize necessary indexes for performance
5. Fall back to IndexedDB if SQLite fails to load
