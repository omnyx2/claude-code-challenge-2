# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

E-commerce data utilities project providing query functions for a SQLite database. TypeScript with ES modules (`"type": "module"`).

## Development Commands

```bash
# Install dependencies and initialize Claude settings
npm run setup

# Run the entry point
npx tsx src/main.ts

# Type-check the project
npx tsc --noEmit

# Run Claude Agent SDK example
npm run sdk
```

No test framework is configured yet (`npm test` is a placeholder).

## Architecture

- `src/main.ts` - Entry point, runs daily as a cron job
- `src/schema.ts` - SQLite schema creation (12 tables for e-commerce: customers, products, orders, reviews, promotions, inventory, warehouses, etc.)
- `src/queries/` - All database query modules (customer, product, order, analytics, inventory, promotion, review, shipping)
- `hooks/` - Claude Code hook scripts (query duplication check, TypeScript type checking, file read validation)
- `scripts/init-claude.js` - Copies `.claude/settings.example.json` to `.claude/settings.local.json` with `$PWD` replacement

## Query Conventions

All query functions live in `src/queries/` and follow this pattern:

- Accept `db: Database` as the first parameter (from the `sqlite` package)
- Return `Promise<any>` or `Promise<any[]>`
- Use `db.get()` for single records, `db.all()` for multiple records
- Use parameterized queries (`?` placeholders) for all user inputs
- Use `async/await` syntax with the `sqlite` wrapper (not raw `sqlite3` callbacks)

```typescript
export async function getCustomerByEmail(db: Database, email: string): Promise<any> {
  return await db.get(`SELECT * FROM customers WHERE email = ?`, [email]);
}
```

## Critical Guidance

- **All database queries must be written in `./src/queries/`** - never place query logic in other directories
- The `sqlite` package (Promise-based wrapper) is used, not raw `sqlite3` callbacks

## Hooks System

Hooks are configured in `.claude/settings.local.json` and run shell commands before/after Claude Code tool executions.

### Registered Hooks

- **PreToolUse (Read):** `hooks/read_hook.js` — blocks access to `.env` files
- **PreToolUse (Write/Edit):** `hooks/query_hook.js` — checks for query duplication using Claude Agent SDK
- **PostToolUse (Write/Edit):** Prettier auto-format → `hooks/tsc.js` type checking → `hooks/log_hook.js` change logging

### Exit Codes

- `exit(0)` — allow the tool to proceed
- `exit(2)` — block the tool; stderr message is shown to Claude

### Hook Input (stdin)

Hooks receive JSON via stdin with the tool invocation data:
- `tool_name` — the tool being used (Read, Write, Edit, etc.)
- `tool_input.file_path` — target file path
- `tool_input.content` — file content (Write tool)
- `tool_input.old_string` / `tool_input.new_string` — edit strings (Edit tool)

### Settings.json Structure

- `PreToolUse` — runs BEFORE tool execution (can block with exit code 2)
- `PostToolUse` — runs AFTER tool execution (for formatting, logging, validation)
- `matcher` — regex pattern matching tool names (e.g., `"Write|Edit|MultiEdit"`, `"Read"`, `"*"`)

### Debugging Hooks

```bash
# Inspect stdin data a hook receives
jq . > debug.json

# Test a hook manually
echo '{"tool_input":{"file_path":"src/queries/test.ts"}}' | node hooks/my_hook.js
```
