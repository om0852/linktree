#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { fileURLToPath } from 'url';
import { TreeInBioClient } from './client.mjs';
import { resolveConfig } from './config.mjs';

/**
 * Creates and configures the TreeInBio MCP Server
 */
export function createMcpServer(options = {}) {
  const config = resolveConfig(options);
  const client = options.client || new TreeInBioClient(config);

  const server = new Server(
    {
      name: 'treeinbio-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  // List of available MCP tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'get_profile',
          description: 'Retrieve full bio profile including display name, bio, theme, layout, and links count.',
          inputSchema: {
            type: 'object',
            properties: {
              username: { type: 'string', description: 'Target profile username. Defaults to configured user.' },
            },
          },
        },
        {
          name: 'update_profile',
          description: 'Update profile bio, display name, theme preset, typography, button shape, or social accounts.',
          inputSchema: {
            type: 'object',
            properties: {
              username: { type: 'string', description: 'Target username.' },
              name: { type: 'string', description: 'Display name.' },
              bio: { type: 'string', description: 'Bio description text.' },
              theme: { type: 'string', description: 'Theme preset name (e.g. dark-glass, emerald-gold, neon, sunset, minimal-light, atelier).' },
              buttonShape: { type: 'string', description: 'Button geometry: sharp, rounded, pill, brutalism.' },
              headlineFont: { type: 'string', description: 'Headline typography font.' },
              avatarUrl: { type: 'string', description: 'Avatar image URL.' },
              socials: { type: 'object', description: 'Social links dictionary (instagram, twitter, youtube, etc.).' },
            },
          },
        },
        {
          name: 'list_links',
          description: 'List all links and collections in the bio page with clicks, badges, and active state.',
          inputSchema: {
            type: 'object',
            properties: {
              username: { type: 'string', description: 'Target username.' },
            },
          },
        },
        {
          name: 'add_link',
          description: 'Add a new link or card to the bio page.',
          inputSchema: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Link title text.' },
              url: { type: 'string', description: 'Target destination URL.' },
              subtitle: { type: 'string', description: 'Optional subtitle or caption.' },
              badge: { type: 'string', description: 'Optional badge tag text (e.g. "NEW", "HOT", "SAVE 20%").' },
              icon: { type: 'string', description: 'Lucide icon name (e.g. Globe, Youtube, Github, ShoppingBag).' },
              type: { type: 'string', description: 'Link type: standard, header, product, video, newsletter, music.' },
              size: { type: 'string', enum: ['small', 'large'], description: 'Size of the card.' },
              active: { type: 'boolean', description: 'Whether the link is active and visible.' },
              username: { type: 'string', description: 'Target username.' },
            },
            required: ['title', 'url'],
          },
        },
        {
          name: 'update_link',
          description: 'Update an existing link card on the bio page.',
          inputSchema: {
            type: 'object',
            properties: {
              linkId: { type: 'string', description: 'The unique ID of the link to update.' },
              title: { type: 'string', description: 'Updated title.' },
              url: { type: 'string', description: 'Updated URL.' },
              subtitle: { type: 'string', description: 'Updated subtitle.' },
              badge: { type: 'string', description: 'Updated badge text.' },
              icon: { type: 'string', description: 'Updated icon name.' },
              type: { type: 'string', description: 'Updated link type.' },
              size: { type: 'string', enum: ['small', 'large'], description: 'Card size.' },
              active: { type: 'boolean', description: 'Active toggle.' },
              username: { type: 'string', description: 'Target username.' },
            },
            required: ['linkId'],
          },
        },
        {
          name: 'delete_link',
          description: 'Permanently remove a link from the bio page.',
          inputSchema: {
            type: 'object',
            properties: {
              linkId: { type: 'string', description: 'ID of the link to delete.' },
              username: { type: 'string', description: 'Target username.' },
            },
            required: ['linkId'],
          },
        },
        {
          name: 'archive_link',
          description: 'Toggle soft-archive status of a link (retains click analytics while hiding from bio).',
          inputSchema: {
            type: 'object',
            properties: {
              linkId: { type: 'string', description: 'ID of the link to archive/unarchive.' },
              username: { type: 'string', description: 'Target username.' },
            },
            required: ['linkId'],
          },
        },
        {
          name: 'get_analytics',
          description: 'Get telemetry analytics: total page views, link clicks, CTR, device breakdown, top referrers, and geo data.',
          inputSchema: {
            type: 'object',
            properties: {
              username: { type: 'string', description: 'Target username.' },
              range: { type: 'string', enum: ['7d', '30d', '90d', 'all'], description: 'Time range. Defaults to 30d.' },
            },
          },
        },
        {
          name: 'export_analytics',
          description: 'Export telemetry analytics as raw CSV string.',
          inputSchema: {
            type: 'object',
            properties: {
              username: { type: 'string', description: 'Target username.' },
              range: { type: 'string', enum: ['7d', '30d', '90d', 'all'], description: 'Time range.' },
            },
          },
        },
        {
          name: 'get_social_proof',
          description: 'Get real-time social proof data and recent visitor activity count.',
          inputSchema: {
            type: 'object',
            properties: {
              username: { type: 'string', description: 'Target username.' },
            },
          },
        },
        {
          name: 'list_leads',
          description: 'List captured subscriber leads, newsletter signups, and lead magnet inquiries.',
          inputSchema: {
            type: 'object',
            properties: {
              username: { type: 'string', description: 'Target username.' },
              status: { type: 'string', enum: ['all', 'pending', 'contacted', 'converted'], description: 'Filter status.' },
              query: { type: 'string', description: 'Search term for name or email.' },
            },
          },
        },
        {
          name: 'export_leads',
          description: 'Export captured leads as CSV data.',
          inputSchema: {
            type: 'object',
            properties: {
              username: { type: 'string', description: 'Target username.' },
            },
          },
        },
        {
          name: 'delete_lead',
          description: 'Delete a lead record by ID.',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Lead record ID.' },
              username: { type: 'string', description: 'Target username.' },
            },
            required: ['id'],
          },
        },
        {
          name: 'list_bookings',
          description: 'List appointment bookings and client consultations.',
          inputSchema: {
            type: 'object',
            properties: {
              username: { type: 'string', description: 'Creator username.' },
              date: { type: 'string', description: 'Optional date filter (YYYY-MM-DD).' },
            },
          },
        },
        {
          name: 'create_booking',
          description: 'Create a new appointment / booking slot.',
          inputSchema: {
            type: 'object',
            properties: {
              creator: { type: 'string', description: 'Creator username.' },
              clientName: { type: 'string', description: 'Client name.' },
              clientEmail: { type: 'string', description: 'Client email.' },
              serviceName: { type: 'string', description: 'Service or consultation name.' },
              date: { type: 'string', description: 'Appointment date (YYYY-MM-DD).' },
              timeSlot: { type: 'string', description: 'Time slot (e.g. "14:00").' },
              notes: { type: 'string', description: 'Optional booking notes.' },
            },
            required: ['creator', 'clientName', 'clientEmail', 'serviceName', 'date', 'timeSlot'],
          },
        },
        {
          name: 'cancel_booking',
          description: 'Cancel an existing appointment booking.',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Booking ID.' },
            },
            required: ['id'],
          },
        },
        {
          name: 'list_domains',
          description: 'List custom domains configured for bio workspaces.',
          inputSchema: {
            type: 'object',
            properties: {
              username: { type: 'string', description: 'Target username.' },
            },
          },
        },
        {
          name: 'add_domain',
          description: 'Attach a custom domain to a bio workspace (e.g. bio.creator.com).',
          inputSchema: {
            type: 'object',
            properties: {
              hostname: { type: 'string', description: 'Domain hostname.' },
              username: { type: 'string', description: 'Target username.' },
            },
            required: ['hostname'],
          },
        },
        {
          name: 'verify_domain',
          description: 'Trigger DNS and SSL verification check for a custom domain.',
          inputSchema: {
            type: 'object',
            properties: {
              hostname: { type: 'string', description: 'Domain hostname to verify.' },
            },
            required: ['hostname'],
          },
        },
        {
          name: 'delete_domain',
          description: 'Remove a custom domain mapping.',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Custom domain ID.' },
            },
            required: ['id'],
          },
        },
        {
          name: 'list_api_keys',
          description: 'List programmatic API keys and their permissions.',
          inputSchema: {
            type: 'object',
            properties: {
              username: { type: 'string', description: 'Target username.' },
            },
          },
        },
        {
          name: 'create_api_key',
          description: 'Generate a new API key for automated or CLI access.',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Descriptive name for the API key.' },
              permissions: {
                type: 'array',
                items: { type: 'string' },
                description: 'Permissions list (e.g. ["*"] or ["links:read", "analytics:read"]).',
              },
              username: { type: 'string', description: 'Target username.' },
            },
            required: ['name'],
          },
        },
        {
          name: 'revoke_api_key',
          description: 'Revoke and permanently delete an API key.',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'API Key ID to revoke.' },
            },
            required: ['id'],
          },
        },
        {
          name: 'list_workspaces',
          description: 'List all multi-profile workspaces owned or accessible by the caller.',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'create_workspace',
          description: 'Create a new brand bio workspace under the user account.',
          inputSchema: {
            type: 'object',
            properties: {
              username: { type: 'string', description: 'Unique username handle for new workspace.' },
              name: { type: 'string', description: 'Brand or creator display name.' },
            },
            required: ['username', 'name'],
          },
        },
        {
          name: 'switch_workspace',
          description: 'Switch active workspace session to target username.',
          inputSchema: {
            type: 'object',
            properties: {
              username: { type: 'string', description: 'Target workspace username.' },
            },
            required: ['username'],
          },
        },
        {
          name: 'scrape_product',
          description: 'Extract title, price, description, and preview image from an ecommerce product URL (Amazon, Etsy, Shopify, etc.).',
          inputSchema: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'Product page URL.' },
            },
            required: ['url'],
          },
        },
        {
          name: 'get_media_kit',
          description: 'Fetch public media kit metrics, social stats, and partnership rates.',
          inputSchema: {
            type: 'object',
            properties: {
              username: { type: 'string', description: 'Target creator username.' },
            },
            required: ['username'],
          },
        },
      ],
    };
  });

  // Handle Tool Calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;

    try {
      let resultData;

      switch (name) {
        case 'get_profile': {
          resultData = await client.getProfile(args.username);
          break;
        }

        case 'update_profile': {
          const profileUpdates = { ...args };
          delete profileUpdates.username;
          if (args.username) profileUpdates.username = args.username;
          resultData = await client.updateProfile(profileUpdates);
          break;
        }

        case 'list_links': {
          resultData = await client.listLinks(args.username);
          break;
        }

        case 'add_link': {
          const { username, ...linkInput } = args;
          resultData = await client.addLink(linkInput, username);
          break;
        }

        case 'update_link': {
          const { linkId, username, ...updates } = args;
          resultData = await client.updateLink(linkId, updates, username);
          break;
        }

        case 'delete_link': {
          resultData = await client.deleteLink(args.linkId, args.username);
          break;
        }

        case 'archive_link': {
          resultData = await client.toggleArchiveLink(args.linkId, args.username);
          break;
        }

        case 'get_analytics': {
          resultData = await client.getAnalytics(args.username, args.range || '30d');
          break;
        }

        case 'export_analytics': {
          resultData = await client.exportAnalyticsCsv(args.username, args.range || '30d');
          break;
        }

        case 'get_social_proof': {
          resultData = await client.getSocialProof(args.username);
          break;
        }

        case 'list_leads': {
          resultData = await client.listLeads(args.username, args.status || 'all', args.query || '');
          break;
        }

        case 'export_leads': {
          resultData = await client.exportLeadsCsv(args.username);
          break;
        }

        case 'delete_lead': {
          resultData = await client.deleteLead(args.id, args.username);
          break;
        }

        case 'list_bookings': {
          resultData = await client.listBookings(args.username, args.date || '');
          break;
        }

        case 'create_booking': {
          resultData = await client.createBooking(args);
          break;
        }

        case 'cancel_booking': {
          resultData = await client.cancelBooking(args.id);
          break;
        }

        case 'list_domains': {
          resultData = await client.listDomains(args.username);
          break;
        }

        case 'add_domain': {
          resultData = await client.addDomain(args.hostname, args.username);
          break;
        }

        case 'verify_domain': {
          resultData = await client.verifyDomain(args.hostname);
          break;
        }

        case 'delete_domain': {
          resultData = await client.deleteDomain(args.id);
          break;
        }

        case 'list_api_keys': {
          resultData = await client.listApiKeys(args.username);
          break;
        }

        case 'create_api_key': {
          resultData = await client.createApiKey(args.name, args.permissions || ['*'], args.username);
          break;
        }

        case 'revoke_api_key': {
          resultData = await client.revokeApiKey(args.id);
          break;
        }

        case 'list_workspaces': {
          resultData = await client.listWorkspaces();
          break;
        }

        case 'create_workspace': {
          resultData = await client.createWorkspace({ username: args.username, name: args.name });
          break;
        }

        case 'switch_workspace': {
          resultData = await client.switchWorkspace(args.username);
          break;
        }

        case 'scrape_product': {
          resultData = await client.scrapeProduct(args.url);
          break;
        }

        case 'get_media_kit': {
          resultData = await client.getMediaKit(args.username);
          break;
        }

        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool "${name}"`);
      }

      const formatted = typeof resultData === 'string'
        ? resultData
        : JSON.stringify(resultData, null, 2);

      return {
        content: [
          {
            type: 'text',
            text: formatted,
          },
        ],
      };
    } catch (err) {
      console.error(`[TreeInBio MCP] Error executing tool "${name}":`, err.message);
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error: ${err.message}`,
          },
        ],
      };
    }
  });

  // Resources Listing
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const user = client.username || 'me';
    return {
      resources: [
        {
          uri: `treeinbio://profile/${user}`,
          name: `Bio Profile (${user})`,
          description: 'Live profile data, design settings, and active links.',
          mimeType: 'application/json',
        },
        {
          uri: `treeinbio://analytics/${user}`,
          name: `Telemetry Analytics (${user})`,
          description: 'Live views, link clicks, CTR, and referrer intelligence.',
          mimeType: 'application/json',
        },
        {
          uri: `treeinbio://leads/${user}`,
          name: `Captured Leads (${user})`,
          description: 'Subscribers and lead capture data.',
          mimeType: 'application/json',
        },
      ],
    };
  });

  // Resources Reading
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    const match = uri.match(/^treeinbio:\/\/(profile|analytics|leads)(?:\/([^/]+))?$/);

    if (!match) {
      throw new McpError(ErrorCode.InvalidRequest, `Unknown resource URI: ${uri}`);
    }

    const [, type, targetUsername] = match;
    const user = targetUsername === 'me' ? null : targetUsername;

    let data;
    if (type === 'profile') {
      data = await client.getProfile(user);
    } else if (type === 'analytics') {
      data = await client.getAnalytics(user, '30d');
    } else if (type === 'leads') {
      data = await client.listLeads(user);
    }

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  });

  return server;
}

/**
 * Starts the MCP Server over Stdio
 */
export async function startMcpServer(options = {}) {
  // Direct diagnostic messages to stderr to keep stdout pure for JSON-RPC
  console.error('[TreeInBio MCP] Starting TreeInBio MCP Server on stdio...');
  const server = createMcpServer(options);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[TreeInBio MCP] TreeInBio MCP Server connected and listening.');
}

// Auto-run if executed directly
const isDirectRun = process.argv[1] && (
  process.argv[1] === fileURLToPath(import.meta.url) ||
  process.argv[1].endsWith('mcp.mjs')
);

if (isDirectRun) {
  startMcpServer().catch((err) => {
    console.error('[TreeInBio MCP] Fatal startup error:', err);
    process.exit(1);
  });
}
