# System & Agent Rules

## 1. Intent Verification & Clarification
- If a user prompt or task intent is unclear, underspecified, or ambiguous, **DO NOT** make assumptions or execute arbitrary fallback actions (such as raw text typing).
- Always stop and ask the user for clarification before proceeding with execution.

## 2. Browser Control & Automation
- For all browser automation, navigation, scraping, and web interaction tasks, use the **`xtradevpilot` MCP server** tools (`navigate`, `click_element`, `type_text`, `get_dom_snapshot`, etc.).
- Browser activities must strictly target **Google Chrome**, as `xtradevpilot` is integrated into Chrome.

## 3. Strict Command Routing
- Never route web navigation or search prompts (e.g. Apify/Store searches) into local file search tools (`search_files`).
- Never fallback to raw keyboard typing (`type_text`) when software generation or complex app creation is requested.

## 4. Empirical Verification Before Success
- Never declare a task resolved, a bug fixed, or a feature working until concrete empirical runtime verification (build, lint, or test commands) has passed cleanly.

## 5. No Error Masking
- Never resolve issues by swallowing exceptions, masking symptoms, returning dummy fallbacks, or deleting failing assertions. Always identify and fix the underlying root cause.

## 6. Codebase Exploration & Feature Tracing (`codebase-trainer`)
- Always prioritize and use `npx codebase-trainer` (`flow`, `search`, `context`, `query`, `routes`) as the primary tool to discover, search, trace, and inspect any features, bugs, or execution paths in this codebase.
- Before reading multiple large source files or executing ad-hoc searches, run `npx codebase-trainer flow "<feature/action>"` or `npx codebase-trainer search "<query>"` to minimize token consumption and pinpoint exact code locations instantly.
