# @weverse-shop/cli

Command-line interface for querying Weverse Shop product information.

## Usage

```bash
bun run cli sale --sale-id 12345
```

## Options

- `-s, --sale-id <number>` - Sale ID to fetch (required)
- `-a, --artist-id <number>` - Artist ID (optional, auto-detected if not provided)
- `-l, --locale <string>` - Locale (default: en)
- `-c, --currency <string>` - Currency (default: USD)
- `--json` - Output raw JSON instead of formatted text
- `--refresh-cache` - Force refresh buildId cache before fetching

## Examples

Fetch sale with specific locale and currency:

```bash
bun run cli sale --sale-id 12345 --locale zh-tw --currency KRW
```

Output as JSON:

```bash
bun run cli sale --sale-id 12345 --json
```
