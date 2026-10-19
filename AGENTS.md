<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# System & Agent Operational Rules

## 1. Intent Verification & Clarification
- If a user prompt or task intent is unclear, underspecified, or ambiguous, **DO NOT** make assumptions or execute arbitrary fallback actions (such as raw text typing).
- Always stop and ask the user for clarification before proceeding with execution.

## 2. Browser Control & Automation (`xtradevpilot` + Chrome)
- For all browser automation, navigation, scraping, and web interaction tasks, use the **`xtradevpilot` MCP server** tools (`navigate`, `click_element`, `type_text`, `get_dom_snapshot`, etc.).
- Browser activities must strictly target **Google Chrome**, as `xtradevpilot` is integrated into Chrome.

## 3. Command Routing & Fallbacks
- Never route web navigation or online search prompts (e.g. Apify/Store searches) into local file search tools (`search_files`).
- Never fallback to raw keyboard typing (`type_text`) when software generation or complex app creation is requested.

## 4. Empirical Verification Before Success
- Never declare a task resolved, a bug fixed, or a feature working until concrete empirical runtime verification (build, lint, or test commands) has passed cleanly.

## 5. No Error Masking
- Never resolve issues by swallowing exceptions, masking symptoms, returning dummy fallbacks, or deleting failing assertions. Always identify and fix the underlying root cause.

## 6. Codebase Exploration & Feature Tracing (`codebase-trainer`)
- Always prioritize and use `npx codebase-trainer` (`flow`, `search`, `context`, `query`, `routes`) as the primary tool to discover, search, trace, and inspect any features, bugs, or execution paths in this codebase.
- Before reading multiple large source files or executing ad-hoc searches, run `npx codebase-trainer flow "<feature/action>"` or `npx codebase-trainer search "<query>"` to minimize token consumption and pinpoint exact code locations instantly.

