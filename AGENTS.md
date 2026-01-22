# AI Agent Guidelines

This document outlines standards, conventions, and architectural patterns for AI agents working on this codebase.

## Build, Lint, and Test Commands

### Root Level

```bash
bun install              # Install all dependencies
bun run prettier --write . # Format all files
```

### Package: @weverse-shop/core

```bash
cd packages/core
bun run src/index.ts     # Run the main module
bun test                 # Run tests (when added)
```

### Package: @weverse-shop/cli

```bash
cd packages/cli
bun run cli              # Run CLI
bun test                 # Run tests (when added)
```

### Package: @weverse-shop/watcher

```bash
cd packages/watcher
bun run dev              # Start dev server with scheduled tasks
bun run deploy           # Deploy to Cloudflare
bun run check-types      # Type check without emitting
bun run db:generate      # Generate Drizzle migrations
bun run db:migrate       # Apply migrations to D1
bun run tunnel           # Expose local dev server via cloudflared
bun test                 # Run tests (when added)
```

### Testing

- **Framework**: Bun's built-in test runner (`bun test`)
- **Status**: No tests configured yet
- **Guideline**: When adding features, write tests using Bun's test runner
- **Test files**: Name as `*.test.ts` alongside source files

```typescript
// Example test structure
import { test, expect } from 'bun:test'

test('getSale fetches product data', async () => {
  const result = await getSale({ saleId: '123' })
  expect(result).toBeDefined()
})
```

## Runtime and Package Manager

- **Runtime**: Bun (not Node.js)
- **Package manager**: Bun with workspaces
- **Monorepo structure**: 3 packages under `packages/*`
  - `@weverse-shop/core`: Core API client and parser
  - `@weverse-shop/cli`: Command-line interface
  - `@weverse-shop/watcher`: Cloudflare Worker with Hono

## Code Style Guidelines

**NO EMOJI IN THE CODEBASE**

### Formatting (Prettier)

- **Single quotes**: `'string'` (not `"string"`)
- **No semicolons**: Omit trailing semicolons
- **Configured in**: `.prettierrc`

```json
{
  "singleQuote": true,
  "semi": false
}
```

### Import Organization

Order imports as follows (blank line between groups):

1. External packages (zod, cheerio, hono, drizzle-orm, etc.)
2. Workspace packages (`@weverse-shop/core`)
3. Relative imports (`./`, `../`)
4. Type-only imports use `import type` keyword

```typescript
import { z } from 'zod'
import { Hono } from 'hono'

import { getSale } from '@weverse-shop/core'

import { getProductBySaleId } from './data/products'
import { LINE_SIGNATURE_HTTP_HEADER_NAME } from './constants/line'

import type { SaleData, GetSaleOptions } from './types'
```

### Naming Conventions

| Item             | Convention                         | Example                                  |
| ---------------- | ---------------------------------- | ---------------------------------------- |
| Source files     | kebab-case                         | `client.ts`, `parser.ts`, `buildid.ts`   |
| Data layer files | Plural nouns, kebab-case           | `products.ts`, `users.ts`, `variants.ts` |
| Database schema  | `schema.ts` in db folder           | `db/schema.ts`                           |
| Route handlers   | Singular noun                      | `line.ts`                                |
| Types/Interfaces | PascalCase                         | `type SaleData`, `interface User`        |
| Constants files  | `constants.ts` or `constants/*.ts` | `constants.ts`, `constants/commands.ts`  |
| Constants        | camelCase or SCREAMING_SNAKE_CASE  | `buildIdCache`, `DEFAULT_LOCALE`         |
| Functions        | camelCase                          | `getSale()`, `parseResponse()`           |

### Function Declarations

- Use `function name() {}` for top-level and exported functions
- Use arrow functions only for callbacks, inline handlers, or when required by context

```typescript
// Preferred
export function getSale(options: GetSaleOptions) { ... }
export async function getBuildId(forceRefresh = false) { ... }

// Arrow functions for callbacks
const filtered = items.filter((item) => item.active)
setTimeout(() => clearCache(), 3600000)
```

### Type Safety

- **Strict TypeScript**: No `any`. Use explicit types.
- **Zod as single source of truth**: Define Zod schemas, then infer types
- **Inferred return types**: Omit explicit return types when TypeScript can infer them

```typescript
// Zod schema → Type inference pattern
export const saleDataSchema = z.object({
  saleId: z.string(),
  title: z.string(),
  price: z.number()
})

export type SaleData = z.infer<typeof saleDataSchema>

// Let TypeScript infer simple return types
export function getProductBySaleId({ saleId }: { saleId: string }) {
  return db.query.products.findFirst({ where: eq(products.saleId, saleId) })
}

// Explicit types for complex or exported APIs when needed
export function processWebhook(payload: unknown): WebhookResult { ... }
```

### Error Handling

- **Explicit error messages**: Include context, HTTP status, URLs, etc.
- **Zod validation errors**: Format with path information
- **Database queries**: Return `null` when not found (safe)
- **API errors**: Throw exceptions with details (fail fast)

```typescript
// Good: Explicit error with context
throw new Error(
  `Failed to fetch sale data (HTTP ${response.status}): ${response.statusText}\n` +
    `URL: ${url}`,
)

// Good: Formatted Zod validation errors
throw new Error(
  'Failed to validate sale data structure.\n' +
    'Validation errors:\n' +
    parseResult.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n'),
)

// Good: Null return for safe queries
export async function getProductBySaleId({ saleId }: { saleId: string }) {
  return db.query.products.findFirst({ where: eq(products.saleId, saleId) }) // Returns null if not found
}
```

### Comments

- **NO** explanatory comments (e.g., "I added this to...")
- **NO** redundant "what" comments (e.g., `// saves the user`)
- **YES** "why" comments for non-obvious design decisions

```typescript
// Bad
// This function gets the sale data
export function getSale() { ... }

// Good
// Force buildId refresh on 404 since Next.js rotates buildIds on deployment
if (errorMessage.includes('HTTP 404')) {
  buildId = await getBuildId(true)
}
```

## Architecture Patterns

### Package Structure

**@weverse-shop/core** - API client and parser

```
src/
├── index.ts          # Public exports
├── client.ts         # Main getSale() function
├── parser.ts         # Response parsing & Zod validation
├── buildid.ts        # Build ID caching logic
├── types.ts          # Zod schemas + inferred types
├── constants.ts      # Shared constants
└── utils.ts          # Helper functions
```

**@weverse-shop/watcher** - Cloudflare Worker

```
src/
├── index.ts          # Hono app + worker exports
├── scheduled.ts      # Cron job handler
├── routes/           # HTTP route handlers
├── data/             # Database query layer
│   ├── products.ts
│   ├── users.ts
│   └── ...
├── db/
│   └── schema.ts     # Drizzle ORM schemas
├── lib/              # Reusable utilities
├── apis/             # External API clients
└── constants/        # Shared constants
```

### Data Layer Pattern

Files in `data/` folder follow consistent naming:

```typescript
// data/products.ts
export async function getProductBySaleId({ saleId }: { saleId: string }) { ... }
export async function upsertProduct({ sale }: { sale: SaleData }) { ... }
export async function isProductStored({ saleId }: { saleId: string }) { ... }

// Parameters: Always use destructured objects for named arguments
// Returns: null for not found, throw for errors
```

### Cloudflare Worker Patterns

**Hono App Structure**

```typescript
const app = new Hono<{ Bindings: CloudflareBindings }>()

app.get('/health', (c) => c.text('OK'))
app.route('/line', lineBotRoute)

export default {
  fetch: app.fetch,
  scheduled: async (controller, env, ctx) => {
    ctx.waitUntil(handleScheduledTask())
  },
}
```

**Middleware for Webhook Validation**

```typescript
lineBotRoute.use('*', async (c, next) => {
  const signature = c.req.header(LINE_SIGNATURE_HTTP_HEADER_NAME)
  const body = await c.req.text()
  if (!validateSignature(body, secret, signature)) {
    throw new Error('Signature validation failed')
  }
  await next()
})
```

## DRY Principle

**CRITICAL**: Before implementing utilities or functions:

1. Search the codebase for similar implementations
2. If implementation is similar enough, refactor and abstract core logic
3. If needed across packages, add to `@weverse-shop/core`

## Approach to Problem Solving

- When asked to solve an error or issue, **ALWAYS** propose solutions that are industry-standard practices, not "quick fixes"
- Prioritize scalable, maintainable solutions that won't cause future problems
- Only propose quick-fixes when specifically asked to
