# AI Agent Guidelines

This document outlines standards, conventions, and architectural patterns for AI agents working on this codebase.

## Code Style Guidelines

NO EMOJI IN THE CODEBASE

### Formatting (Prettier)

- **Single quotes**: `'string'` (not `"string"`)
- **No semicolons**: Omit trailing semicolons
- **JSX single quotes**: `<Component prop='value' />`
- **Tailwind class sorting**: Automatic via `prettier-plugin-tailwindcss`

### Import Organization

Order imports as follows (blank line between groups):

1. External packages (React, Next.js, third-party)
2. Internal shared packages (`@fa/ui`, `@fa/core`, `@fa/auth`)
3. Local absolute imports (`~/`, `@/`)
4. Relative imports (`./`, `../`)
5. Type-only imports use `type` keyword: `import type { User } from '~/types'`

```typescript
import { useState } from "react";
import Link from "next/link";

import { Button } from "@fa/ui/components/ui/button";
import { tryCatch } from "@fa/core/lib/try-catch";

import { getUser } from "~/server/auth";
import { EventCard } from "~/components/EventCard";

import type { Event } from "~/types";
```

### Naming Conventions

| Item                   | Convention                                                | Example                                    |
| ---------------------- | --------------------------------------------------------- | ------------------------------------------ |
| React Components       | kebab-case file & PascalCase function                     | `event-card.tsx`, `function EventCard()`   |
| Custom Hooks           | `use-` prefix, kebab-case file                            | `use-mobile.tsx`, `function useIsMobile()` |
| Server Actions         | `actions.ts` in route folders                             | `app/(user)/actions.ts`                    |
| Data Layer             | kebab-case                                                | `events.ts`, `users.ts`                    |
| Schemas                | `-schema` suffix or `schema` file in its repective folder | `event-schema.ts`                          |
| Types/Interfaces       | PascalCase                                                | `type Event`, `interface ButtonProps`      |
| Constants              | camelCase or SCREAMING_SNAKE                              | `systemPrompt`, `MOBILE_BREAKPOINT`        |
| Internal functions     | `INTERNAL__` prefix                                       | `INTERNAL__parseEvent()`                   |
| Wrapped server actions | `server_` prefix                                          | `server_getEventList`                      |

### Function Declarations

- Use `function name() {}` for top-level and exported functions
- Use arrow functions only for callbacks, inline handlers, or when required by context

```typescript
// Preferred
export function getUser() { ... }
export async function fetchEvents() { ... }

// Arrow functions for callbacks
useEffect(() => { ... }, [])
const filtered = items.filter((item) => item.active)
```

### Type Safety

- **Strict TypeScript**: No `any`. Use explicit types.
- **Zod validation**: Use for API inputs, form data, and environment variables
- **Inferred return types**: Omit explicit return types when TypeScript can infer them

```typescript
// Let TypeScript infer simple return types
function getUser() {
  return db.user.findFirst({ where: { id } })
}

// Explicit types for complex or exported APIs
export function processEvent(input: EventInput): ProcessedEvent { ... }
```

### Comments

- **NO** explanatory comments (e.g., "I added this to...")
- **NO** redundant "what" comments (e.g., `// saves the user`)
- **YES** "why" comments for non-obvious design decisions

## DRY Principle

**CRITICAL**: Before implementing utilities or components:

1. Search other apps for similar implementations. If the implementation is similar enough, you should refactor and abstract the core functions/logics
2. If needed in multiple places, add to a shared package

## Approach to problem solving

- When you're asked to solve an error or an issue, please **ALWAYS** propose solution that are not just "quick fix" but an industry-standard practice that can scale and won't cause more problems.
  - Only propose quick-fixes when specifically asked to.
