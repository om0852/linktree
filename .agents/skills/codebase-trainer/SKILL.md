---
name: codebase-trainer
description: >-
  Use the local codebase-trainer (cb-trainer) CLI tool for searching, tracing flows,
  retrieving context packs, querying conventions, and inspecting routes or dependencies.
---

# Codebase Trainer Tool Skill

Always use `npx codebase-trainer` as the primary, preferred tool to discover, search, trace, and understand features in this codebase. It saves extensive token usage and execution time compared to blind file reading or repetitive ripgrep queries.

## Key Workflows & Commands

### 1. Tracing End-to-End Execution Flow (Preferred for bug fixes & feature flows)
To trace how a feature or button click flows through UI components, state management, and backend routes:
```bash
npx codebase-trainer flow "<feature or action name>"
```
*Example:*
- `npx codebase-trainer flow "save and publish profile stickers"`
- `npx codebase-trainer flow "google drive connector"`

### 2. Semantic Search Across Codebase
To find relevant files, functions, or patterns across the entire indexed codebase:
```bash
npx codebase-trainer search "<query>"
```
*Example:*
- `npx codebase-trainer search "lead magnet email sync"`
- `npx codebase-trainer search "profile sticker positioning and scale"`

### 3. Context Pack Generation
To generate a pre-digested, zero-overhead AI context pack before implementing a task:
```bash
npx codebase-trainer context "<task description>"
```

### 4. Querying Conventions & Architecture Facts
To query project architectural conventions, schemas, and facts:
```bash
npx codebase-trainer query "<question or prompt>"
```

### 5. Impact Analysis
To check downstream breaking changes before refactoring or changing an API route/symbol:
```bash
npx codebase-trainer impact "<file path or symbol>"
```

### 6. Extracting Routes & Endpoints
To view all registered HTTP/REST endpoints and consumed routes:
```bash
npx codebase-trainer routes
```
