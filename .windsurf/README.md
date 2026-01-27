# Windsurf Configuration for HVSNA Project

This directory contains Windsurf-specific configuration and rules for the HVSNA (Hijri Calendar App) project.

## Files Overview

- `rules.md` - Project-specific coding standards and guidelines
- `project.json` - Windsurf project configuration
- `.windsurfrules` - Custom rule definitions for Windsurf

## Key Rules Enforced

### 1. File Naming Convention

- All filenames must use snake_case with dashes
- Examples: `use-task.ts`, `day-note.tsx`, `task-manager.test.tsx`

### 2. TypeScript Only

- No JavaScript files allowed in the codebase
- All code must be written in TypeScript (.ts) or TSX (.tsx)

### 3. Testing Requirements

- All new source files must have corresponding test files
- Test files should be co-located in `__tests__` directories
- Use `.test.ts` or `.test.tsx` suffix for test files

### 4. No Examples Policy

- Do not create example, demo, or sample files unless explicitly requested
- Focus on production code only

## Project Structure

```text
app/
├── .client/           # Client-side code
├── .server/           # Server-side code
├── lib/               # Type definitions and utilities
├── utils/             # Shared utilities
└── routes/            # Route components
```

## Technology Stack

- **Framework**: React Router v7
- **Language**: TypeScript
- **Database**: PouchDB
- **Styling**: Tailwind CSS
- **Testing**: Vitest
- **Build Tool**: Vite

## Usage

The Windsurf extension will automatically apply these rules when working on the project. Rules are enforced through:

1. **File naming validation** - Ensures consistent naming conventions
2. **TypeScript enforcement** - Prevents JavaScript file creation
3. **Test coverage reminders** - Prompts for test file creation
4. **Example file prevention** - Avoids unnecessary demo files

## Scripts Integration

The rules integrate with existing npm scripts:

- `npm run test` - Run all tests
- `npm run typecheck` - TypeScript type checking
- `npm run build` - Build the project

Always run tests before committing changes to ensure code quality.
