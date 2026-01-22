# @weverse-shop/watcher

Cloudflare Worker that monitors Weverse Shop products and sends notifications via LINE bot when items come back in stock. Includes scheduled tasks for automatic monitoring and Slack notifications for system alerts.

## Features

- LINE bot integration for user subscriptions and notifications
- Scheduled monitoring (runs every 15 minutes)
- Slack notifications for system events
- Drizzle ORM with Cloudflare D1 database
- REST API built with Hono

## Development

```bash
bun run dev
```

## Deployment

```bash
bun run deploy
```

## Database

Generate migrations:

```bash
bun run db:generate
```

Apply migrations:

```bash
bun run db:migrate
```

## Other Commands

Type checking:

```bash
bun run check-types
```

Local tunnel (for LINE webhook testing):

```bash
bun run tunnel
```
