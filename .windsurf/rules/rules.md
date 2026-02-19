# Project-Specific Rules

## Code Style & Standards

### File Naming

- Use snake_case for all filenames with dashes (e.g., `use-task.ts`, `day-note.tsx`)
- TypeScript files should use `.ts` extension
- TSX files should use `.tsx` extension
- Test files should be named with `.test.ts` or `.test.tsx` suffix

### Language Requirements

- All code must be written in TypeScript or TSX
- No JavaScript files allowed in the codebase
- Maintain strict TypeScript configuration

### Testing Requirements

- **Always verify tests** - All code changes must have corresponding passing tests
- Run `npm run test` before committing changes
- Test files should be co-located with source files in `__tests__` directories
- Use Vitest for testing with jsdom environment
- Follow existing test patterns in the codebase

### Code Development Guidelines

- **Do not create examples unless explicitly asked** - Focus on production code only
- Follow existing code patterns and conventions
- Use established hooks and utilities from the codebase
- Maintain consistency with existing PouchDB and React Router patterns

### Project Structure

- Client-side code in `.client/` directories
- Server-side code in `.server/` directories  
- Shared utilities in `utils/` directories
- Types in `lib/` directories
- Follow established folder structure

### Technology Stack

- React Router v7 for routing
- PouchDB for data persistence
- Tailwind CSS for styling
- Vitest for testing
- TypeScript for type safety

### Import Patterns

- Use `~/` alias for app imports (configured in tsconfig.json)
- Import React hooks and components properly
- Follow existing import organization

### Data Management

- Use PouchDB for local data storage
- Follow best practive patterns for CRUD operations
- Use proper TypeScript interfaces for data models
- Maintain consistent error handling patterns
