# @synkra/n8n-validator

CLI tool to validate, auto-fix, and deploy n8n workflow JSON files.

Zero external dependencies. Requires Node.js 18+.

## Installation

```bash
# Run directly with npx (no install needed)
npx @synkra/n8n-validator --help

# Or install globally
npm install -g @synkra/n8n-validator
n8n-validator --help
```

## Usage

### Validate workflows from n8n instance

```bash
npx @synkra/n8n-validator --url https://n8n.example.com --api-key YOUR_KEY
```

### Validate + auto-fix

```bash
npx @synkra/n8n-validator --url https://n8n.example.com --api-key KEY --fix --output-dir ./fixed/
```

### Validate + auto-fix + deploy back to n8n

```bash
npx @synkra/n8n-validator --url https://n8n.example.com --api-key KEY --fix --deploy
```

### Validate local files

```bash
# Single file
npx @synkra/n8n-validator --file workflow.json

# Directory
npx @synkra/n8n-validator --dir ./workflows/
```

## Options

| Option | Short | Description |
|--------|-------|-------------|
| `--url` | `-u` | n8n instance URL |
| `--api-key` | `-k` | n8n API key |
| `--file` | `-f` | Path to workflow JSON file |
| `--dir` | `-d` | Directory with workflow JSON files |
| `--fix` | | Auto-fix safe issues |
| `--deploy` | | Deploy fixed workflows back to n8n |
| `--dry-run` | | Preview deploy without executing |
| `--output-dir` | | Save fixed workflows to directory |
| `--json` | `-j` | Output as JSON |
| `--severity` | `-s` | Filter: `all`, `error`, `warning` |
| `--output` | `-o` | Write report to file |
| `--help` | `-h` | Show help |

## Validation Rules

### Structure (STRUCT)
- Required fields validation
- Node types and positions
- Duplicate node names
- Trigger configuration

### Expressions (EXPR)
- `={{ }}` syntax validation
- Node references
- Code node anti-patterns
- Dot notation for names with spaces

### Connections (CONN)
- Orphan nodes detection
- Circular references
- Webhook/RespondToWebhook pairing

### Credentials (CRED)
- Missing credentials
- Hardcoded secrets detection
- Webhook authentication
- API keys in URLs

### Best Practices (BEST)
- Error handling
- Deprecated nodes
- Workflow size limits
- SplitInBatches loops

## Auto-Fix Rules

| Rule | Description |
|------|-------------|
| FIX-EXPR-001 | Remove `={{ }}` inside Code nodes |
| FIX-EXPR-003 | Fix trailing dots in expressions |
| FIX-EXPR-020 | Fix `$node.Name` for names with spaces |
| FIX-EXPR-030 | Fix single braces `={}` → `={{}}` |
| FIX-STRUCT-030 | Add `settings.executionOrder = "v1"` |
| FIX-STRUCT-031 | Add missing meta object |
| FIX-BEST-010 | Upgrade deprecated nodes |
| FIX-CONN-001 | Remove ghost connections |
| FIX-CONN-011 | Remove connections to non-existent targets |
| FIX-CONN-040 | Fix webhook responseMode |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success (no errors or all fixed) |
| 1 | Validation errors remain |
| 2 | Fatal error |

## License

MIT
