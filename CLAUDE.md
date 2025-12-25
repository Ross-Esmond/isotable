# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development server (runs on port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run serve

# Run all tests
npm run test

# Linting and formatting
npm run lint          # Fix with ESLint
npm run format        # Run Prettier
npm run check         # Format with Prettier and fix with ESLint
```

## Technology Stack

- **Framework**: TanStack Start (React-based meta-framework with SSR support)
- **Router**: TanStack Router (file-based routing in `src/routes`)
- **Build Tool**: Vite with React plugin and React Compiler
- **Styling**: Tailwind CSS v4 (configured via `@tailwindcss/vite`)
- **UI Components**: Radix UI primitives + shadcn/ui
- **State Management**: Immutable.js for immutable data structures
- **3D Rendering**: Three.js for WebGL rendering
- **Backend**: Supabase (PostgreSQL database with real-time subscriptions)
- **Testing**: Vitest with Testing Library
- **Type Safety**: TypeScript with strict mode + T3 Env for environment variables

## Architecture Overview

### Event Sourcing System

The application uses an event sourcing architecture where all state changes are represented as immutable events. This is the core of the application:

- **Events** (`src/lib/Event.ts`): Defines event types (Create, Grab, Drag, Drop) that represent all state changes
- **Event Processor** (`src/lib/eventProcessor.ts`): Processes events into the current component state using Immutable.js Maps
- **Logic Clock** (`src/lib/logicClock.ts`): Implements a Snowflake-like distributed ID generation system (52-bit: 36-bit timestamp + 8-bit source + 8-bit index) to ensure event ordering

### Surface System

The Surface abstraction manages the application's canvas/workspace:

- **Surface** (`src/lib/Surface.ts`): Core immutable surface that manages events, components, camera, and Three.js scene. All mutations return new Surface instances.
- **SupabaseSurface** (`src/lib/SupabaseSurface.ts`): Wrapper that handles database synchronization, separating local events from database events
- **Component** (`src/lib/Component.ts`): Represents draggable objects on the surface with position, size, and grab state
- **Camera** (`src/lib/Camera.ts`): Immutable camera with pan/zoom, pointer tracking, and world-to-screen coordinate conversion

Key patterns:

- All state is immutable (using Immutable.js)
- New events are appended, never removed (event sourcing)
- Components are derived from events via `processEvents()`
- Three.js meshes are created/updated during render

### Database Integration

- Uses Supabase for persistence with an `events` table
- `SupabaseSurface.setDatabaseEvents()` merges database events with local events
- Real-time updates via Supabase channels (currently logs changes)
- Database events are converted from `DatabaseEvent` format to internal `Event` format via `processDatabaseEvent()`

### Playspaces

- Each online session is called a "playspace" and is tracked in the `playspaces` table in Supabase.
- Playspaces keep track of how many sources of events are connected, generally one per browser tab.
- Source 0 is reserved for server-generated events.

### File Organization

```
src/
├── routes/          # TanStack Router file-based routes
│   ├── __root.tsx   # Root layout with <Outlet />
│   └── index.tsx    # Home page
├── lib/             # Core business logic
│   ├── Surface.ts           # Main canvas state manager
│   ├── SupabaseSurface.ts   # Database sync wrapper
│   ├── Event.ts             # Event type definitions
│   ├── eventProcessor.ts    # Event → Component state
│   ├── Component.ts         # Draggable object model
│   ├── Camera.ts            # Camera/viewport model
│   └── logicClock.ts        # Distributed ID generation
├── env.ts           # T3 Env configuration
└── router.tsx       # Router setup
```

## Important Conventions

### Immutability

All state is immutable using Immutable.js:

- Use `.asMutable()` for batch updates, then `.asImmutable()`
- All classes return new instances on mutation (Surface, Camera, Component)
- Events are append-only; removing events throws an error

### Event Processing

- Events must have monotonically increasing `snowportId` values
- `processEvents()` is memoized and only processes new events since last call
- Components are computed from events, not stored directly
- Grab/Drag/Drop events reference components by `componentId`

### Environment Variables

Configured via T3 Env in `src/env.ts`:

- Server vars: `SERVER_URL`
- Client vars (must start with `VITE_`): `VITE_APP_TITLE`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Import and use: `import { env } from '@/env'`

### Adding UI Components

Use shadcn/ui for new components:

```bash
pnpx shadcn@latest add button
```

### Testing

- Tests use Vitest with `jest-immutable-matchers` for Immutable.js assertions
- Test files: `*.test.ts` (see `src/lib/eventProcessor.test.ts`)
- No separate vitest.config.ts; configuration is in vite.config.ts via Vite

### Path Aliases

TypeScript is configured with `@/*` mapping to `src/*`:

```typescript
import { Surface } from '@/lib/Surface';
```
