# TreeInBio MCP: let any AI assistant run your bio page

TreeInBio exposes a **remote MCP server** so Claude, ChatGPT, Cursor, Gemini CLI
or any other MCP client can design a profile, manage links, read analytics and
handle leads, bookings and domains — with the same rules as the Studio.

## What existed before

- `cli/mcp.mjs`: a stdio MCP server (29 tools) that only runs from a local copy
  of this repository with Node installed, so end users could not use it.
- Writes fetched the whole profile and posted it back from the client.
- API keys had a `permissions` field that nothing enforced, and an API key could
  create new full-access API keys.
- `GET /api/profile?username=` returned the visitor view for a second workspace
  the caller owned.

## Plan (v1, built)

1. **Hosted endpoint** `POST /api/mcp` (MCP Streamable HTTP, stateless, JSON
   responses). Users paste one URL and one API key; nothing to install.
2. **One tool layer on the server** (`src/lib/mcp/`). Tools call the existing
   route handlers in-process, so validation, sanitising, ownership checks and
   contrast rules are exactly the Studio's. Profile edits are patches: the tool
   reads the owner view, changes only the requested fields, and saves.
3. **Scoped API keys**: `read` (look, never change) or `write` (full). Enforced
   for every non-GET request made with a key. Keys cannot manage keys; that
   needs a signed-in session.
4. **Workspaces**: every tool takes an optional `workspace` (username); the
   default is the key's account. Any workspace the account owns works.
5. **AI Assistants page** (`/ai`): create read-only or full keys, revoke them,
   and copy ready-made configs for Claude, Cursor, ChatGPT and others.
6. **Discoverability**: `list_design_options` returns every theme, template,
   font, shape, button style, highlight and icon an AI may choose from, and
   `get_profile` reports readability, so an assistant can design without
   guessing ids.

## Tools

| Tool | Scope | What it does |
|---|---|---|
| `whoami` | read | Account, workspaces and public URLs |
| `get_profile` | read | Profile, design, links, widgets and readable colours |
| `list_design_options` | read | Themes, templates, fonts, shapes, buttons, highlights, icons |
| `list_links` | read | Links in order (optionally archived ones) |
| `get_analytics` | read | Views, clicks, CTR, locations, devices, top links |
| `list_leads` | read | Captured leads (filter by status / search) |
| `list_bookings` | read | Bookings (optionally for one date) |
| `list_domains` | read | Custom domains and DNS status |
| `update_profile` | write | Name, bio, location, avatar, cover, socials, layouts |
| `apply_theme` | write | Apply a theme (or a random one) with readable colours |
| `apply_template` | write | Apply a full template; starter links only if none exist |
| `update_design` | write | Fonts, wallpaper, buttons, colours, footer |
| `add_link` / `update_link` / `delete_link` | write | Manage links |
| `set_link_archived` / `reorder_links` | write | Archive or reorder links |
| `update_widgets` | write | Contact form, booking, tip jar, newsletter, stats |
| `update_booking` | write | Confirm / cancel a booking, set its meeting URL |
| `create_meet_link` | write | Google Meet link for a booking (needs Google Calendar) |
| `add_domain` / `verify_domain` | write | Connect a custom domain |

Changes are saved and live immediately, the same as pressing Publish.

## Connecting

Create a key on the **AI Assistants** page, then:

- **Claude (claude.ai / Desktop) and ChatGPT connectors**: add a custom
  connector with URL `https://<your-domain>/api/mcp` and header
  `Authorization: Bearer <key>`.
- **Cursor** (`.cursor/mcp.json`):
  ```json
  { "mcpServers": { "treeinbio": { "url": "https://<your-domain>/api/mcp", "headers": { "Authorization": "Bearer <key>" } } } }
  ```
- **Clients that only speak stdio**:
  ```json
  { "mcpServers": { "treeinbio": { "command": "npx", "args": ["-y", "mcp-remote", "https://<your-domain>/api/mcp", "--header", "Authorization:Bearer <key>"] } } }
  ```

## v1.1: tools for working on a page end to end

- `check_page` reviews a page and lists issues with the tool that fixes each.
- Shop: `list_products`, `add_product`, `update_product`, `remove_product`,
  `set_shop_visible`. Stickers: `list_stickers`, `remove_stickers` (placing
  stickers stays in the Studio). Card colour: `update_design colors.card`.
  Booking availability: `update_widgets schedule_meeting` (days, hours, slot
  length, time zone). Leads: `update_lead_status`.
- Every page edit accepts `dry_run` (preview the changes, save nothing) and
  `if_unchanged_since` (refuse if the page changed after the assistant read
  it). Saves also refuse to overwrite a page that changed while the tool ran.
- `apply_changes` makes up to 15 edits as one save with one undo; every item
  is validated first and nothing is saved if one is invalid.

## What assistants can never do

There are no tools, and no tool arguments, for: the account (email,
password, username), API keys, access gates / passcodes, tracking pixels,
creating or deleting workspaces, deleting custom domains, or bulk-deleting
leads. Page edits only change the fields they name; everything else is
copied from the saved page.

## Security

- **Personal keys only.** `/api/mcp` accepts per-user API keys, never browser
  cookies and never the platform master key. The master key (admin access as
  any user) is off unless `ALLOW_MASTER_API_KEY=true` and
  `PLATFORM_MASTER_API_KEY` are both set; `TREEINBIO_API_KEY` is only the
  *client* variable the CLI sends.
- **Scopes.** `read` keys are refused on every non-GET request (REST and MCP).
  Keys cannot create or revoke keys.
- **Expiry.** New keys expire after 7, 30, 90 (default) or 365 days, or never.
  Expired keys stop working immediately.
- **Rate limits.** 120 requests a minute and 5,000 a day per key, counted in
  MongoDB so the limit holds across serverless instances.
- **Untrusted visitor data.** Lead and booking text written by visitors is
  returned under `visitor_submitted`, with a notice and server instructions
  telling the assistant never to follow instructions found there (prompt
  injection).
- **Confirmation.** `delete_link` and cancelling a booking require
  `confirm: true`, which assistants are told to set only on the owner's
  explicit request.
- **Activity log and undo.** Every change made through MCP is logged for 90
  days (`McpActivity`) and listed on the AI Assistants page. The newest page
  edit of each workspace can be undone; undo is refused if the page changed
  afterwards. Viewing and undoing need a signed-in session, not a key.
- **Errors.** Unexpected server errors are logged and reported to the
  assistant without internal details.
- **Deletion budget.** At most 25 deletions/removals (links, products,
  stickers, cancelled bookings) per key per day, even if an assistant is
  told to do more.
- **Safe values only.** Links must be https/mailto/tel, images https (no
  `data:` or `javascript:`), colours 6-digit hex, gradients CSS gradients only,
  fonts/themes/icons from fixed lists, and pages are capped at 60 links,
  40 products and 12 social handles.

## Next steps (not built yet)

- OAuth sign-in for connectors that require it instead of API keys.
- Sticker placement and collections tools.
- Point the stdio CLI server at `/api/mcp` so both share one tool list.
- Finer scopes (design, links, leads, bookings) and per-workspace keys.
