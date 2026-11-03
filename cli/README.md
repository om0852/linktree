# 🌲 TreeInBio CLI & Model Context Protocol (MCP) Server

Universal developer tools and AI agent integrations for the **TreeInBio** creator bio platform.

---

## ⚡ Quick Start

### 1. Run the CLI
```bash
# View available commands
npm run cli -- --help

# Check connection status
npm run cli -- status

# Output in JSON format
npm run cli -- status --json
```

### 2. Start the MCP Server
```bash
# Start MCP server on stdio for Cursor, Claude Desktop, or Antigravity
npm run mcp
# or
npm run cli -- mcp start
```

### 3. Run the Test Suites
```bash
# Run CLI and MCP unit test suite
npm run test:cli

# Run core platform unit tests
npm run test:unit
```

---

## 🔌 Integrating the MCP Server into AI Agents

The TreeInBio MCP server runs over standard `stdio` and complies with the [Model Context Protocol](https://modelcontextprotocol.io/).

### A. Claude Desktop
Add to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "treeinbio": {
      "command": "node",
      "args": ["<PATH_TO_TREEINBIO>/cli/mcp.mjs"],
      "env": {
        "TREEINBIO_API_URL": "http://localhost:3000",
        "TREEINBIO_API_KEY": "tree_live_your_api_key_here"
      }
    }
  }
}
```

### B. Cursor (`.cursor/mcp.json`)
```json
{
  "mcpServers": {
    "treeinbio": {
      "command": "node",
      "args": ["./cli/mcp.mjs"],
      "env": {
        "TREEINBIO_API_URL": "http://localhost:3000"
      }
    }
  }
}
```

### C. Antigravity / Gemini CLI (`mcp_config.json`)
```json
{
  "mcpServers": {
    "treeinbio": {
      "command": "node",
      "args": ["./cli/mcp.mjs"]
    }
  }
}
```

---

## 🛠️ MCP Tools Overview (28 Built-In Tools)

| Tool Name | Description | Key Arguments |
|:---|:---|:---|
| `get_profile` | Get full bio page profile, bio text, theme, and design | `username` |
| `update_profile` | Update profile bio, name, theme preset, typography, button shape | `name`, `bio`, `theme`, `buttonShape`, `headlineFont` |
| `list_links` | List all links and collections on the bio page | `username` |
| `add_link` | Create a new link, product card, or banner | `title`, `url`, `subtitle`, `badge`, `icon`, `size`, `type` |
| `update_link` | Modify existing link attributes | `linkId`, `title`, `url`, `badge`, `icon`, `active` |
| `delete_link` | Permanently remove a link from bio page | `linkId` |
| `archive_link` | Toggle soft-archive (hides from bio while keeping analytics) | `linkId` |
| `get_analytics` | Query views, unique visitors, clicks, CTR, and top referrers | `username`, `range` (`7d`, `30d`, `90d`, `all`) |
| `export_analytics` | Export raw telemetry data as CSV string | `username`, `range` |
| `get_social_proof` | Fetch real-time active visitor counts and ticker data | `username` |
| `list_leads` | Retrieve captured newsletter signups and contact leads | `username`, `status`, `query` |
| `export_leads` | Export leads list as CSV | `username` |
| `delete_lead` | Delete a captured lead record | `id` |
| `list_bookings` | List appointment / consultation bookings | `username`, `date` |
| `create_booking` | Schedule a new appointment slot | `creator`, `clientName`, `clientEmail`, `serviceName`, `date`, `timeSlot` |
| `cancel_booking` | Cancel a scheduled booking | `id` |
| `list_domains` | List verified custom domains attached to bio workspaces | `username` |
| `add_domain` | Attach custom domain (e.g. `bio.creator.com`) | `hostname` |
| `verify_domain` | Trigger automated DNS & SSL check for domain | `hostname` |
| `delete_domain` | Remove custom domain mapping | `id` |
| `list_api_keys` | View programmatic API keys | `username` |
| `create_api_key` | Generate new scoped API key (`tree_live_...`) | `name`, `permissions` |
| `revoke_api_key` | Revoke an API key | `id` |
| `list_workspaces` | List all linked multi-profile brand workspaces | None |
| `create_workspace` | Create a new brand workspace profile | `username`, `name` |
| `switch_workspace` | Switch active workspace session | `username` |
| `scrape_product` | Extract metadata from Amazon, Etsy, or Shopify URLs | `url` |
| `get_media_kit` | Retrieve public sponsor rates and reach statistics | `username` |

---

## 💻 CLI Commands & Examples

### 1. Authentication & Configuration
```bash
# Log in interactively or via flags
npm run cli -- auth login --email user@example.com --password secret

# Check current session & active workspace
npm run cli -- whoami

# Configure API URL or Key
npm run cli -- config set apiUrl https://bio.myagency.com
npm run cli -- config set apiKey tree_live_xxxxxxxxxxxxxxxx
npm run cli -- config show
npm run cli -- config clear

# Log out
npm run cli -- auth logout
```

### 2. Bio Profile & Workspaces
```bash
# Inspect profile
npm run cli -- profile get alice

# Update appearance settings
npm run cli -- profile update --theme dark-glass --shape rounded --bio "Visual Designer & Art Director"

# List & switch multi-brand agency workspaces
npm run cli -- profile workspaces
npm run cli -- profile switch brand_xyz
npm run cli -- profile create new_brand "New Brand Studio"
```

### 3. Links Management
```bash
# List links for profile
npm run cli -- links list alice

# Add links
npm run cli -- links add "My YouTube Channel" "https://youtube.com/@alice" --badge "NEW" --icon Youtube
npm run cli -- links add "Shop My Presets" "https://presets.store" --size large

# Update or soft-archive links
npm run cli -- links update link_12345 --title "Updated Title"
npm run cli -- links archive link_12345
npm run cli -- links delete link_12345
```

### 4. Telemetry Analytics & Leads
```bash
# Query analytics
npm run cli -- analytics get alice --range 30d

# Export CSV to file
npm run cli -- analytics export alice --out ./analytics.csv

# Inspect captured subscriber leads
npm run cli -- leads list alice
npm run cli -- leads export alice --out ./leads.csv
npm run cli -- leads delete lead_id_99
```

### 5. Custom Domains & API Keys
```bash
# Manage custom domains
npm run cli -- domains list
npm run cli -- domains add bio.creator.com
npm run cli -- domains verify bio.creator.com

# Manage API Keys for automated agents
npm run cli -- keys list
npm run cli -- keys create "Claude Integration Key"
npm run cli -- keys revoke key_id_123
```

### 6. Product Scraper
```bash
npm run cli -- scrape https://www.amazon.com/dp/B08N5WRWNW
```

---

## 📦 Programmatic SDK Usage

You can also import and use `TreeInBioClient` directly in any Node.js project:

```javascript
import { TreeInBioClient } from './cli/client.mjs';

const client = new TreeInBioClient({
  apiUrl: 'http://localhost:3000',
  apiKey: 'tree_live_...',
  username: 'creator_handle',
});

// Fetch profile & links
const profile = await client.getProfile();

// Add link
await client.addLink({
  title: 'Check out my newsletter',
  url: 'https://newsletter.example.com',
  badge: 'POPULAR',
});

// Telemetry
const stats = await client.getAnalytics(null, '30d');
console.log('Views:', stats.totalViews, 'Clicks:', stats.totalClicks);
```
