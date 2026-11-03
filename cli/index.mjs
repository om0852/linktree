#!/usr/bin/env node
import fs from 'fs';
import readline from 'readline';
import { TreeInBioClient } from './client.mjs';
import { loadStoredConfig, saveStoredConfig, clearStoredConfig, resolveConfig } from './config.mjs';
import { startMcpServer } from './mcp.mjs';

const VERSION = '1.0.0';

// ANSI Styling helpers
const isColorSupported = !process.env.NO_COLOR && process.stdout.isTTY !== false;
const style = {
  reset: isColorSupported ? '\x1b[0m' : '',
  bold: isColorSupported ? '\x1b[1m' : '',
  dim: isColorSupported ? '\x1b[2m' : '',
  green: isColorSupported ? '\x1b[32m' : '',
  emerald: isColorSupported ? '\x1b[38;2;16;185;129m' : '',
  cyan: isColorSupported ? '\x1b[36m' : '',
  yellow: isColorSupported ? '\x1b[33m' : '',
  red: isColorSupported ? '\x1b[31m' : '',
  magenta: isColorSupported ? '\x1b[35m' : '',
};

function printBanner() {
  console.log(`
${style.emerald}${style.bold}  ████████╗██████╗ ███████╗███████╗██╗███╗   ██╗██████╗ ██╗ ██████╗ 
  ╚══██╔══╝██╔══██╗██╔════╝██╔════╝██║████╗  ██║██╔══██╗██║██╔═══██╗
     ██║   ██████╔╝█████╗  █████╗  ██║██╔██╗ ██║██████╔╝██║██║   ██║
     ██║   ██╔══██╗██╔══╝  ██╔══╝  ██║██║╚██╗██║██╔══██╗██║██║   ██║
     ██║   ██║  ██║███████╗███████╗██║██║ ╚████║██████╔╝██║╚██████╔╝
     ╚═╝   ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝╚═╝  ╚═══╝╚═════╝ ╚═╝ ╚═════╝ ${style.reset}
  ${style.dim}Universal CLI & MCP Toolkit v${VERSION}${style.reset}
`);
}

function promptLine(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

function parseCliArgs(argv) {
  const args = argv.slice(2);
  const flags = {
    json: false,
  };
  const positionals = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--json') {
      flags.json = true;
    } else if (arg === '-h' || arg === '--help') {
      flags.help = true;
    } else if (arg === '-v' || arg === '--version') {
      flags.version = true;
    } else if (arg.startsWith('--')) {
      const key = arg.slice(2);
      if (key.includes('=')) {
        const [k, v] = key.split('=');
        flags[k] = v;
      } else {
        const nextArg = args[i + 1];
        if (nextArg && !nextArg.startsWith('-')) {
          flags[key] = nextArg;
          i++;
        } else {
          flags[key] = true;
        }
      }
    } else {
      positionals.push(arg);
    }
  }

  return { positionals, flags };
}

function printHelp() {
  printBanner();
  console.log(`
${style.bold}USAGE:${style.reset}
  $ treeinbio <command> [subcommand] [arguments] [flags]

${style.bold}GLOBAL FLAGS:${style.reset}
  --json                  Output raw JSON response
  --api-url <url>         Override TreeInBio API endpoint (default: http://localhost:3000)
  --api-key <key>         Use explicit API key (tree_live_...)
  --token <token>         Use explicit JWT bearer token
  --username <user>       Target specific brand bio workspace
  -h, --help              Show help menu
  -v, --version           Print version

${style.bold}AUTHENTICATION & STATUS:${style.reset}
  treeinbio whoami / status                  Display current auth status & active workspace
  treeinbio auth login                       Log in with credentials
  treeinbio auth logout                      Clear saved credentials and log out

${style.bold}CONFIGURATION:${style.reset}
  treeinbio config show                      Display local stored configuration
  treeinbio config set <key> <val>           Set config option (apiUrl, apiKey, token, username)
  treeinbio config clear                     Wipe saved config file

${style.bold}PROFILE & WORKSPACES:${style.reset}
  treeinbio profile get [username]           Show profile details, theme, and bio
  treeinbio profile update [flags]           Update bio, name, theme, buttonShape
  treeinbio profile workspaces               List all multi-brand bio workspaces
  treeinbio profile switch <username>        Switch active brand workspace
  treeinbio profile create <user> <name>     Create a new workspace profile

${style.bold}LINKS MANAGEMENT:${style.reset}
  treeinbio links list [username]            List all bio links and stats
  treeinbio links add <title> <url> [flags]  Add a new bio link
  treeinbio links update <id> [flags]        Update link title, URL, badge, active status
  treeinbio links archive <id>               Toggle archive state for a link
  treeinbio links delete <id>                Permanently delete a link

${style.bold}ANALYTICS & LEADS:${style.reset}
  treeinbio analytics get [user] [--range]   Telemetry views, clicks, CTR, top referrers
  treeinbio analytics export [user] [--out]  Export analytics data as CSV
  treeinbio leads list [user] [--status]     List captured email/phone leads
  treeinbio leads export [user] [--out]      Export captured leads as CSV
  treeinbio leads delete <id>                Delete lead record

${style.bold}BOOKINGS & CALENDAR:${style.reset}
  treeinbio bookings list [user] [--date]    List appointment bookings
  treeinbio bookings cancel <id>             Cancel a booking

${style.bold}CUSTOM DOMAINS:${style.reset}
  treeinbio domains list [username]          List custom domains
  treeinbio domains add <hostname>           Attach custom domain
  treeinbio domains verify <hostname>        Trigger DNS verification
  treeinbio domains delete <id>              Remove custom domain

${style.bold}API KEYS:${style.reset}
  treeinbio keys list [username]             List API keys
  treeinbio keys create <name>               Generate a new API key
  treeinbio keys revoke <id>                 Revoke an API key

${style.bold}ECOMMERCE & PRODUCT SCRAPER:${style.reset}
  treeinbio scrape <url>                     Extract product data from Amazon, Etsy, Shopify

${style.bold}MCP SERVER (MODEL CONTEXT PROTOCOL):${style.reset}
  treeinbio mcp start                        Launch MCP Server on stdio for Cursor/Claude/AGY
`);
}

function renderTable(headers, rows) {
  if (rows.length === 0) {
    console.log(`${style.dim}No records found.${style.reset}`);
    return;
  }
  const colWidths = headers.map((h, i) => {
    const maxVal = Math.max(...rows.map((r) => String(r[i] ?? '').length));
    return Math.max(h.length, maxVal);
  });

  const sep = colWidths.map((w) => '─'.repeat(w + 2)).join('┼');
  const headerLine = headers.map((h, i) => ` ${style.bold}${h.padEnd(colWidths[i])}${style.reset} `).join('│');

  console.log(headerLine);
  console.log(sep);
  for (const row of rows) {
    const rowLine = row.map((c, i) => ` ${String(c ?? '').padEnd(colWidths[i])} `).join('│');
    console.log(rowLine);
  }
}

export async function runCli(argv = process.argv) {
  const { positionals, flags } = parseCliArgs(argv);

  if (flags.version) {
    console.log(`treeinbio v${VERSION}`);
    return 0;
  }

  if (flags.help || positionals.length === 0) {
    printHelp();
    return 0;
  }

  const [command, subcommand, ...extra] = positionals;

  // Resolve active client configuration
  const config = resolveConfig({
    apiUrl: flags['api-url'] || flags.apiUrl,
    apiKey: flags['api-key'] || flags.apiKey,
    token: flags.token,
    username: flags.username,
  });

  const client = new TreeInBioClient(config);

  const output = (data, formattedRenderer) => {
    if (flags.json) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      formattedRenderer(data);
    }
  };

  try {
    switch (command) {
      // ----------------------------------------------------
      // MCP SERVER
      // ----------------------------------------------------
      case 'mcp': {
        if (subcommand === 'start' || !subcommand) {
          await startMcpServer({ client });
          return 0;
        }
        console.error(`Unknown mcp subcommand: ${subcommand}. Did you mean: treeinbio mcp start?`);
        return 1;
      }

      // ----------------------------------------------------
      // STATUS / WHOAMI
      // ----------------------------------------------------
      case 'whoami':
      case 'status': {
        const stored = loadStoredConfig();
        let userProfile = null;
        let authMethod = 'None (Anonymous)';

        if (config.apiKey) {
          authMethod = `API Key (${config.apiKey.substring(0, 14)}...)`;
        } else if (config.token) {
          authMethod = 'JWT Bearer Session';
        }

        try {
          userProfile = await client.getMe();
        } catch {
          // May fail if not logged in
        }

        output({ config, stored, userProfile, authMethod }, (data) => {
          console.log(`\n${style.emerald}${style.bold}TreeInBio Status & Connection:${style.reset}`);
          console.log(`  ${style.bold}API Endpoint:${style.reset}   ${config.apiUrl}`);
          console.log(`  ${style.bold}Auth Method:${style.reset}    ${authMethod}`);
          console.log(`  ${style.bold}Active User:${style.reset}    ${config.username || data.userProfile?.user?.username || style.dim + 'Not selected' + style.reset}`);
          if (data.userProfile?.user) {
            console.log(`  ${style.bold}Logged In As:${style.reset}   ${data.userProfile.user.username} (${data.userProfile.user.role || 'creator'})`);
            console.log(`  ${style.bold}Email:${style.reset}          ${data.userProfile.user.email || 'N/A'}`);
          }
          console.log('');
        });
        return 0;
      }

      // ----------------------------------------------------
      // AUTH COMMANDS
      // ----------------------------------------------------
      case 'auth': {
        if (subcommand === 'login') {
          const emailOrUsername = flags.email || flags.username || extra[0] || await promptLine('Enter email or username: ');
          const password = flags.password || extra[1] || await promptLine('Enter password: ');

          if (!emailOrUsername || !password) {
            console.error(`${style.red}Error:${style.reset} Username/email and password are required.`);
            return 1;
          }

          const res = await client.login({ emailOrUsername, password });
          if (res.token) {
            saveStoredConfig({
              token: res.token,
              username: res.user?.username || emailOrUsername,
              apiUrl: config.apiUrl,
            });
          }

          output(res, () => {
            console.log(`${style.green}✓ Logged in successfully as ${style.bold}${res.user?.username || emailOrUsername}${style.reset}!`);
            console.log(`${style.dim}Session token saved to local config.${style.reset}`);
          });
          return 0;
        }

        if (subcommand === 'logout') {
          clearStoredConfig();
          try {
            await client.logout();
          } catch {
            // Ignore server logout errors
          }
          output({ success: true, message: 'Logged out successfully' }, () => {
            console.log(`${style.green}✓ Logged out successfully.${style.reset} Stored credentials cleared.`);
          });
          return 0;
        }

        console.error(`Unknown auth command: "${subcommand}". Usage: treeinbio auth login | logout`);
        return 1;
      }

      // ----------------------------------------------------
      // CONFIG COMMANDS
      // ----------------------------------------------------
      case 'config': {
        if (subcommand === 'show' || !subcommand) {
          const stored = loadStoredConfig();
          output(stored, () => {
            console.log(`\n${style.bold}Stored Local Configuration:${style.reset}`);
            console.log(JSON.stringify(stored, null, 2));
          });
          return 0;
        }

        if (subcommand === 'set') {
          const [key, val] = extra;
          if (!key || val === undefined) {
            console.error('Usage: treeinbio config set <key> <value>');
            return 1;
          }
          const updated = saveStoredConfig({ [key]: val });
          output(updated, () => {
            console.log(`${style.green}✓ Saved config:${style.reset} ${key} = ${val}`);
          });
          return 0;
        }

        if (subcommand === 'clear') {
          clearStoredConfig();
          output({ success: true }, () => {
            console.log(`${style.green}✓ Cleared stored config.${style.reset}`);
          });
          return 0;
        }

        console.error(`Unknown config command: "${subcommand}".`);
        return 1;
      }

      // ----------------------------------------------------
      // PROFILE & WORKSPACES
      // ----------------------------------------------------
      case 'profile': {
        if (subcommand === 'get' || !subcommand) {
          const target = extra[0] || config.username;
          const res = await client.getProfile(target);
          const p = res.profile;

          output(res, () => {
            console.log(`\n${style.emerald}${style.bold}Bio Profile: ${p?.username || target}${style.reset}`);
            console.log(`  ${style.bold}Display Name:${style.reset}  ${p?.name || 'N/A'}`);
            console.log(`  ${style.bold}Bio:${style.reset}           ${p?.bio || style.dim + 'No bio' + style.reset}`);
            console.log(`  ${style.bold}Theme:${style.reset}         ${p?.theme || 'dark-glass'}`);
            console.log(`  ${style.bold}Button Shape:${style.reset}  ${p?.buttonShape || 'rounded'}`);
            console.log(`  ${style.bold}Headline Font:${style.reset} ${p?.headlineFont || 'Inter'}`);
            console.log(`  ${style.bold}Total Links:${style.reset}   ${p?.links?.length || 0}`);
            console.log('');
          });
          return 0;
        }

        if (subcommand === 'update') {
          const target = flags.username || config.username;
          const current = (await client.getProfile(target)).profile;
          const updates = {
            ...current,
            name: flags.name || current?.name,
            bio: flags.bio !== undefined ? flags.bio : current?.bio,
            theme: flags.theme || current?.theme,
            buttonShape: flags.shape || flags.buttonShape || current?.buttonShape,
            headlineFont: flags.font || flags.headlineFont || current?.headlineFont,
            username: target,
          };
          const res = await client.updateProfile(updates);
          output(res, () => {
            console.log(`${style.green}✓ Profile updated successfully!${style.reset}`);
          });
          return 0;
        }

        if (subcommand === 'workspaces') {
          const res = await client.listWorkspaces();
          output(res, () => {
            console.log(`\n${style.bold}Brand Workspaces (${res.workspaces?.length || 0}):${style.reset}`);
            const headers = ['Username', 'Display Name', 'Active', 'Created'];
            const rows = (res.workspaces || []).map((w) => [
              w.username,
              w.name || 'Untitled',
              w.isActive ? `${style.green}YES${style.reset}` : 'no',
              w.createdAt ? new Date(w.createdAt).toLocaleDateString() : 'N/A',
            ]);
            renderTable(headers, rows);
          });
          return 0;
        }

        if (subcommand === 'switch') {
          const target = extra[0];
          if (!target) {
            console.error('Usage: treeinbio profile switch <username>');
            return 1;
          }
          const res = await client.switchWorkspace(target);
          saveStoredConfig({ username: target });
          output(res, () => {
            console.log(`${style.green}✓ Switched active workspace to "${target}".${style.reset}`);
          });
          return 0;
        }

        if (subcommand === 'create') {
          const [newUser, newName] = extra;
          if (!newUser || !newName) {
            console.error('Usage: treeinbio profile create <username> <display_name>');
            return 1;
          }
          const res = await client.createWorkspace({ username: newUser, name: newName });
          output(res, () => {
            console.log(`${style.green}✓ Brand workspace "${newUser}" created successfully!${style.reset}`);
          });
          return 0;
        }

        console.error(`Unknown profile subcommand: "${subcommand}".`);
        return 1;
      }

      // ----------------------------------------------------
      // LINKS MANAGEMENT
      // ----------------------------------------------------
      case 'links': {
        if (subcommand === 'list' || !subcommand) {
          const target = extra[0] || config.username;
          const res = await client.listLinks(target);
          output(res, () => {
            console.log(`\n${style.bold}Links for @${res.username} (${res.links?.length || 0}):${style.reset}`);
            const headers = ['ID', 'Title', 'URL', 'Type', 'Clicks', 'State'];
            const rows = (res.links || []).map((l) => [
              l.id,
              l.title.length > 25 ? l.title.substring(0, 22) + '...' : l.title,
              l.url.length > 30 ? l.url.substring(0, 27) + '...' : l.url,
              l.type || 'standard',
              l.clicks || 0,
              l.isArchived
                ? `${style.yellow}[ARCHIVED]${style.reset}`
                : l.active === false
                ? `${style.red}[INACTIVE]${style.reset}`
                : `${style.green}[ACTIVE]${style.reset}`,
            ]);
            renderTable(headers, rows);
          });
          return 0;
        }

        if (subcommand === 'add') {
          const [title, url] = extra;
          if (!title || !url) {
            console.error('Usage: treeinbio links add <title> <url> [--badge <text>] [--icon <icon>] [--size small|large]');
            return 1;
          }
          const linkPayload = {
            title,
            url,
            badge: flags.badge || '',
            icon: flags.icon || 'Globe',
            size: flags.size || 'small',
            active: !flags.inactive,
            subtitle: flags.subtitle || '',
            type: flags.type || 'standard',
          };
          const res = await client.addLink(linkPayload, flags.username);
          output(res, () => {
            console.log(`${style.green}✓ Added link "${title}" with ID ${res.link.id}${style.reset}`);
          });
          return 0;
        }

        if (subcommand === 'update') {
          const linkId = extra[0];
          if (!linkId) {
            console.error('Usage: treeinbio links update <linkId> [--title <title>] [--url <url>]');
            return 1;
          }
          const updates = {};
          if (flags.title) updates.title = flags.title;
          if (flags.url) updates.url = flags.url;
          if (flags.subtitle !== undefined) updates.subtitle = flags.subtitle;
          if (flags.badge !== undefined) updates.badge = flags.badge;
          if (flags.icon) updates.icon = flags.icon;
          if (flags.active !== undefined) updates.active = flags.active === 'true' || flags.active === true;
          if (flags.size) updates.size = flags.size;

          const res = await client.updateLink(linkId, updates, flags.username);
          output(res, () => {
            console.log(`${style.green}✓ Updated link "${linkId}".${style.reset}`);
          });
          return 0;
        }

        if (subcommand === 'archive') {
          const linkId = extra[0];
          if (!linkId) {
            console.error('Usage: treeinbio links archive <linkId>');
            return 1;
          }
          const res = await client.toggleArchiveLink(linkId, flags.username);
          output(res, () => {
            console.log(`${style.green}✓ ${res.message}${style.reset}`);
          });
          return 0;
        }

        if (subcommand === 'delete') {
          const linkId = extra[0];
          if (!linkId) {
            console.error('Usage: treeinbio links delete <linkId>');
            return 1;
          }
          const res = await client.deleteLink(linkId, flags.username);
          output(res, () => {
            console.log(`${style.green}✓ Deleted link "${linkId}".${style.reset}`);
          });
          return 0;
        }

        console.error(`Unknown links subcommand: "${subcommand}".`);
        return 1;
      }

      // ----------------------------------------------------
      // ANALYTICS & TELEMETRY
      // ----------------------------------------------------
      case 'analytics': {
        const target = extra[0] || config.username;
        const range = flags.range || '30d';

        if (subcommand === 'export') {
          const csvData = await client.exportAnalyticsCsv(target, range);
          if (flags.out) {
            fs.writeFileSync(flags.out, typeof csvData === 'string' ? csvData : csvData.data, 'utf8');
            console.log(`${style.green}✓ Analytics exported to ${flags.out}${style.reset}`);
          } else {
            console.log(typeof csvData === 'string' ? csvData : csvData.data);
          }
          return 0;
        }

        if (subcommand === 'get' || !subcommand) {
          const res = await client.getAnalytics(target, range);
          output(res, () => {
            console.log(`\n${style.emerald}${style.bold}Telemetry Analytics (@${target}, range: ${range}):${style.reset}`);
            console.log(`  ${style.bold}Total Views:${style.reset}       ${res.totalViews ?? res.views ?? 0}`);
            console.log(`  ${style.bold}Unique Visitors:${style.reset}   ${res.uniqueVisitors ?? 0}`);
            console.log(`  ${style.bold}Total Clicks:${style.reset}      ${res.totalClicks ?? res.clicks ?? 0}`);
            console.log(`  ${style.bold}CTR (Click Rate):${style.reset}  ${res.ctr ? res.ctr + '%' : '0%'}`);

            if (res.topReferrers && res.topReferrers.length > 0) {
              console.log(`\n  ${style.bold}Top Traffic Referrers:${style.reset}`);
              for (const ref of res.topReferrers.slice(0, 5)) {
                console.log(`    - ${ref.source || ref.name}: ${ref.count || ref.views} visits`);
              }
            }
            console.log('');
          });
          return 0;
        }

        console.error(`Unknown analytics subcommand: "${subcommand}".`);
        return 1;
      }

      // ----------------------------------------------------
      // LEADS CAPTURE
      // ----------------------------------------------------
      case 'leads': {
        const target = extra[0] || config.username;

        if (subcommand === 'export') {
          const csvData = await client.exportLeadsCsv(target);
          if (flags.out) {
            fs.writeFileSync(flags.out, typeof csvData === 'string' ? csvData : csvData.data, 'utf8');
            console.log(`${style.green}✓ Leads exported to ${flags.out}${style.reset}`);
          } else {
            console.log(typeof csvData === 'string' ? csvData : csvData.data);
          }
          return 0;
        }

        if (subcommand === 'delete') {
          const leadId = extra[0];
          if (!leadId) {
            console.error('Usage: treeinbio leads delete <id>');
            return 1;
          }
          const res = await client.deleteLead(leadId, flags.username);
          output(res, () => {
            console.log(`${style.green}✓ Lead deleted successfully.${style.reset}`);
          });
          return 0;
        }

        if (subcommand === 'list' || !subcommand) {
          const res = await client.listLeads(target, flags.status || 'all', flags.query || '');
          output(res, () => {
            const leads = res.leads || res.data || [];
            console.log(`\n${style.bold}Captured Leads (${leads.length}):${style.reset}`);
            const headers = ['ID', 'Name', 'Email', 'Source / Note', 'Date'];
            const rows = leads.map((l) => [
              l._id || l.id,
              l.name || 'Anonymous',
              l.email,
              l.source || l.serviceName || l.note || 'Newsletter',
              l.createdAt ? new Date(l.createdAt).toLocaleDateString() : 'N/A',
            ]);
            renderTable(headers, rows);
          });
          return 0;
        }

        console.error(`Unknown leads subcommand: "${subcommand}".`);
        return 1;
      }

      // ----------------------------------------------------
      // BOOKINGS
      // ----------------------------------------------------
      case 'bookings': {
        if (subcommand === 'list' || !subcommand) {
          const target = extra[0] || config.username;
          const res = await client.listBookings(target, flags.date || '');
          output(res, () => {
            const bookings = res.bookings || [];
            console.log(`\n${style.bold}Calendar Bookings (${bookings.length}):${style.reset}`);
            const headers = ['ID', 'Client', 'Service', 'Date & Time', 'Status'];
            const rows = bookings.map((b) => [
              b._id || b.id,
              b.clientName ? `${b.clientName} (${b.clientEmail})` : b.clientEmail,
              b.serviceName || 'Consultation',
              `${b.date} ${b.timeSlot || ''}`,
              b.status === 'confirmed' ? `${style.green}confirmed${style.reset}` : b.status,
            ]);
            renderTable(headers, rows);
          });
          return 0;
        }

        if (subcommand === 'cancel') {
          const id = extra[0];
          if (!id) {
            console.error('Usage: treeinbio bookings cancel <id>');
            return 1;
          }
          const res = await client.cancelBooking(id);
          output(res, () => {
            console.log(`${style.green}✓ Booking "${id}" cancelled successfully.${style.reset}`);
          });
          return 0;
        }

        console.error(`Unknown bookings subcommand: "${subcommand}".`);
        return 1;
      }

      // ----------------------------------------------------
      // CUSTOM DOMAINS
      // ----------------------------------------------------
      case 'domains': {
        if (subcommand === 'list' || !subcommand) {
          const target = extra[0] || config.username;
          const res = await client.listDomains(target);
          output(res, () => {
            const domains = res.domains || [];
            console.log(`\n${style.bold}Custom Domains (${domains.length}):${style.reset}`);
            const headers = ['ID', 'Hostname', 'Verified', 'SSL Status'];
            const rows = domains.map((d) => [
              d._id || d.id,
              d.hostname,
              d.verified ? `${style.green}VERIFIED${style.reset}` : `${style.yellow}PENDING${style.reset}`,
              d.sslActive ? `${style.green}ACTIVE${style.reset}` : `${style.dim}PROVISIONING${style.reset}`,
            ]);
            renderTable(headers, rows);
          });
          return 0;
        }

        if (subcommand === 'add') {
          const hostname = extra[0];
          if (!hostname) {
            console.error('Usage: treeinbio domains add <hostname>');
            return 1;
          }
          const res = await client.addDomain(hostname, flags.username);
          output(res, () => {
            console.log(`${style.green}✓ Domain "${hostname}" attached successfully.${style.reset}`);
          });
          return 0;
        }

        if (subcommand === 'verify') {
          const hostname = extra[0];
          if (!hostname) {
            console.error('Usage: treeinbio domains verify <hostname>');
            return 1;
          }
          const res = await client.verifyDomain(hostname);
          output(res, () => {
            console.log(`${style.green}✓ Verification check initiated for "${hostname}".${style.reset}`);
          });
          return 0;
        }

        if (subcommand === 'delete') {
          const id = extra[0];
          if (!id) {
            console.error('Usage: treeinbio domains delete <id>');
            return 1;
          }
          const res = await client.deleteDomain(id);
          output(res, () => {
            console.log(`${style.green}✓ Domain removed successfully.${style.reset}`);
          });
          return 0;
        }

        console.error(`Unknown domains subcommand: "${subcommand}".`);
        return 1;
      }

      // ----------------------------------------------------
      // API KEYS
      // ----------------------------------------------------
      case 'keys': {
        if (subcommand === 'list' || !subcommand) {
          const target = extra[0] || config.username;
          const res = await client.listApiKeys(target);
          output(res, () => {
            const keys = res.keys || [];
            console.log(`\n${style.bold}Programmatic API Keys (${keys.length}):${style.reset}`);
            const headers = ['ID', 'Name', 'Key Prefix', 'Permissions', 'Last Used'];
            const rows = keys.map((k) => [
              k.id,
              k.name,
              k.fullKeyMasked || `${k.keyPrefix}...`,
              (k.permissions || []).join(', '),
              k.lastUsed ? new Date(k.lastUsed).toLocaleDateString() : `${style.dim}Never${style.reset}`,
            ]);
            renderTable(headers, rows);
          });
          return 0;
        }

        if (subcommand === 'create') {
          const name = extra[0];
          if (!name) {
            console.error('Usage: treeinbio keys create <name> [--permissions <p1,p2>]');
            return 1;
          }
          const perms = flags.permissions ? flags.permissions.split(',').map((p) => p.trim()) : ['*'];
          const res = await client.createApiKey(name, perms, flags.username);
          output(res, () => {
            console.log(`\n${style.green}${style.bold}✓ API Key Created Successfully!${style.reset}`);
            console.log(`  ${style.bold}Name:${style.reset}       ${res.key.name}`);
            console.log(`  ${style.bold}Key ID:${style.reset}     ${res.key.id}`);
            console.log(`  ${style.bold}Secret Key:${style.reset} ${style.yellow}${res.fullKey}${style.reset}`);
            console.log(`\n${style.dim}⚠️  Save this key securely now. It cannot be shown again.${style.reset}\n`);
          });
          return 0;
        }

        if (subcommand === 'revoke') {
          const id = extra[0];
          if (!id) {
            console.error('Usage: treeinbio keys revoke <id>');
            return 1;
          }
          const res = await client.revokeApiKey(id);
          output(res, () => {
            console.log(`${style.green}✓ API Key "${id}" revoked successfully.${style.reset}`);
          });
          return 0;
        }

        console.error(`Unknown keys subcommand: "${subcommand}".`);
        return 1;
      }

      // ----------------------------------------------------
      // PRODUCT SCRAPER
      // ----------------------------------------------------
      case 'scrape': {
        const url = extra[0] || subcommand;
        if (!url || !url.startsWith('http')) {
          console.error('Usage: treeinbio scrape <product_url>');
          return 1;
        }
        const res = await client.scrapeProduct(url);
        output(res, () => {
          console.log(`\n${style.green}✓ Scraped Product Metadata:${style.reset}`);
          console.log(`  ${style.bold}Title:${style.reset}       ${res.title || 'N/A'}`);
          console.log(`  ${style.bold}Price:${style.reset}       ${res.price || 'N/A'}`);
          console.log(`  ${style.bold}Description:${style.reset} ${res.description || 'N/A'}`);
          console.log(`  ${style.bold}Image URL:${style.reset}   ${res.imageUrl || 'N/A'}`);
          console.log('');
        });
        return 0;
      }

      default: {
        console.error(`${style.red}Error:${style.reset} Unknown command "${command}".`);
        console.log(`Run ${style.bold}treeinbio --help${style.reset} for a list of available commands.`);
        return 1;
      }
    }
  } catch (err) {
    if (flags.json) {
      console.error(JSON.stringify({ success: false, error: err.message, status: err.status }, null, 2));
    } else {
      console.error(`\n${style.red}${style.bold}Error:${style.reset} ${err.message}`);
      if (err.status === 401) {
        console.error(`${style.dim}Hint: You may need to log in first via "treeinbio auth login" or provide --api-key / --token.${style.reset}`);
      }
    }
    return 1;
  }
}

// Auto-execute if run as script
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('index.mjs') ||
  process.argv[1].endsWith('treeinbio') ||
  process.argv[1].endsWith('treeinbio.mjs')
);

if (isDirectRun) {
  runCli().then((code) => {
    if (code !== 0) process.exit(code);
  }).catch((err) => {
    console.error('Fatal CLI Error:', err);
    process.exit(1);
  });
}
