import test from 'node:test';
import assert from 'node:assert/strict';
import { TreeInBioClient } from '../cli/client.mjs';
import { resolveConfig, loadStoredConfig, saveStoredConfig, clearStoredConfig } from '../cli/config.mjs';
import { createMcpServer } from '../cli/mcp.mjs';
import { runCli } from '../cli/index.mjs';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

test('TreeInBio Config Resolver Suite', async (t) => {
  await t.test('resolves default apiUrl when no config is provided', () => {
    const config = resolveConfig();
    assert.ok(config.apiUrl);
    assert.strictEqual(config.apiUrl.endsWith('/'), false);
  });

  await t.test('overrides apiUrl, apiKey, and username from explicit options', () => {
    const config = resolveConfig({
      apiUrl: 'https://bio.custom.com/',
      apiKey: 'tree_live_test_12345',
      username: 'creator_pro',
    });
    assert.strictEqual(config.apiUrl, 'https://bio.custom.com');
    assert.strictEqual(config.apiKey, 'tree_live_test_12345');
    assert.strictEqual(config.username, 'creator_pro');
  });

  await t.test('stored config write and wipe', () => {
    saveStoredConfig({ testFlag: 'unit_test_val' });
    const loaded = loadStoredConfig();
    assert.strictEqual(loaded.testFlag, 'unit_test_val');

    clearStoredConfig();
    const afterWipe = loadStoredConfig();
    assert.strictEqual(afterWipe.testFlag, undefined);
  });
});

test('TreeInBioClient SDK Unit Suite', async (t) => {
  await t.test('dispatches GET request with API Key and x-target-user header', async () => {
    let capturedUrl = '';
    let capturedHeaders = {};

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
      capturedUrl = url;
      capturedHeaders = options.headers;
      return {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ success: true, profile: { username: 'testuser', links: [] } }),
      };
    };

    try {
      const client = new TreeInBioClient({
        apiUrl: 'http://mock-api.local',
        apiKey: 'tree_live_9876543210',
        username: 'testuser',
      });

      const res = await client.getProfile('testuser');
      assert.strictEqual(res.success, true);
      assert.strictEqual(capturedUrl, 'http://mock-api.local/api/profile?username=testuser');
      assert.strictEqual(capturedHeaders['x-api-key'], 'tree_live_9876543210');
      assert.strictEqual(capturedHeaders['Authorization'], 'Bearer tree_live_9876543210');
      assert.strictEqual(capturedHeaders['x-target-user'], 'testuser');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await t.test('dispatches addLink by fetching profile and saving new link', async () => {
    let savedProfile = null;
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async (url, options) => {
      if (options.method === 'GET' || !options.method) {
        return {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: async () => ({
            profile: { username: 'alice', links: [{ id: 'l_1', title: 'Old Link', url: 'https://old.com' }] },
          }),
        };
      }
      if (options.method === 'POST') {
        savedProfile = JSON.parse(options.body);
        return {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: async () => ({ success: true, profile: savedProfile }),
        };
      }
      throw new Error(`Unexpected request: ${options.method} ${url}`);
    };

    try {
      const client = new TreeInBioClient({ apiUrl: 'http://mock.local', token: 'mock_jwt_123', username: 'alice' });
      const result = await client.addLink({ title: 'My Portfolio', url: 'https://portfolio.test' });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.link.title, 'My Portfolio');
      assert.strictEqual(savedProfile.links.length, 2);
      assert.strictEqual(savedProfile.links[1].url, 'https://portfolio.test');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await t.test('dispatches updateLink and toggleArchiveLink correctly', async () => {
    let savedProfile = null;
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async (url, options) => {
      if (options.method === 'GET' || !options.method) {
        return {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: async () => ({
            profile: {
              username: 'alice',
              links: [{ id: 'link_99', title: 'Original', url: 'https://example.com', isArchived: false }],
            },
          }),
        };
      }
      if (options.method === 'POST') {
        savedProfile = JSON.parse(options.body);
        return {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: async () => ({ success: true, profile: savedProfile }),
        };
      }
      throw new Error(`Unexpected method: ${options.method}`);
    };

    try {
      const client = new TreeInBioClient({ apiUrl: 'http://mock.local', username: 'alice' });

      const updateRes = await client.updateLink('link_99', { title: 'Updated Title' });
      assert.strictEqual(updateRes.link.title, 'Updated Title');

      const archiveRes = await client.toggleArchiveLink('link_99');
      assert.strictEqual(archiveRes.isArchived, true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await t.test('handles HTTP errors cleanly with payload message', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: false,
      status: 403,
      headers: { get: () => 'application/json' },
      json: async () => ({ error: 'Unauthorized to access this bio workspace' }),
    });

    try {
      const client = new TreeInBioClient({ apiUrl: 'http://mock.local' });
      await assert.rejects(
        async () => {
          await client.getProfile('forbidden_user');
        },
        (err) => {
          assert.strictEqual(err.status, 403);
          assert.match(err.message, /Unauthorized to access this bio workspace/);
          return true;
        }
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test('TreeInBio MCP Server Suite', async (t) => {
  const mockClient = {
    username: 'test_creator',
    getProfile: async (u) => ({ success: true, profile: { username: u || 'test_creator', links: [] } }),
    updateProfile: async (p) => ({ success: true, profile: p }),
    listLinks: async (u) => ({ success: true, username: u || 'test_creator', links: [{ id: '1', title: 'Home' }] }),
    addLink: async (input, u) => ({ success: true, link: { id: 'l_new', ...input }, username: u }),
    updateLink: async (id, updates) => ({ success: true, link: { id, ...updates } }),
    deleteLink: async (id) => ({ success: true, message: `Deleted ${id}` }),
    toggleArchiveLink: async (id) => ({ success: true, isArchived: true }),
    getAnalytics: async (u, range) => ({ success: true, totalViews: 4200, uniqueVisitors: 1500, ctr: '12.5' }),
    exportAnalyticsCsv: async () => 'timestamp,views,clicks\n2026-10-20,100,12',
    getSocialProof: async () => ({ success: true, activeVisitors: 7 }),
    listLeads: async () => ({ success: true, leads: [{ id: 'lead_1', email: 'fan@example.com' }] }),
    exportLeadsCsv: async () => 'name,email\nFan,fan@example.com',
    deleteLead: async (id) => ({ success: true }),
    listBookings: async () => ({ success: true, bookings: [] }),
    createBooking: async (b) => ({ success: true, booking: b }),
    cancelBooking: async (id) => ({ success: true }),
    listDomains: async () => ({ success: true, domains: [] }),
    addDomain: async (h) => ({ success: true, domain: { hostname: h } }),
    verifyDomain: async (h) => ({ success: true, verified: true }),
    deleteDomain: async (id) => ({ success: true }),
    listApiKeys: async () => ({ success: true, keys: [] }),
    createApiKey: async (name) => ({ success: true, key: { id: 'k1', name }, fullKey: 'tree_live_abc' }),
    revokeApiKey: async (id) => ({ success: true }),
    listWorkspaces: async () => ({ success: true, workspaces: [] }),
    createWorkspace: async (w) => ({ success: true, workspace: w }),
    switchWorkspace: async (u) => ({ success: true, username: u }),
    scrapeProduct: async (url) => ({ success: true, title: 'Mock Item', price: '$29.99' }),
    getMediaKit: async (u) => ({ success: true, creator: u }),
  };

  const mcpServer = createMcpServer({ client: mockClient });

  await t.test('registers all required tools in ListToolsRequestSchema', async () => {
    const listHandler = mcpServer._requestHandlers.get(ListToolsRequestSchema.shape.method.value);
    assert.ok(listHandler, 'ListTools handler must be registered');

    const result = await listHandler({ method: 'tools/list', params: {} });
    assert.ok(Array.isArray(result.tools));
    const toolNames = result.tools.map((t) => t.name);

    const expectedTools = [
      'get_profile',
      'update_profile',
      'list_links',
      'add_link',
      'update_link',
      'delete_link',
      'archive_link',
      'get_analytics',
      'export_analytics',
      'get_social_proof',
      'list_leads',
      'export_leads',
      'delete_lead',
      'list_bookings',
      'create_booking',
      'cancel_booking',
      'list_domains',
      'add_domain',
      'verify_domain',
      'delete_domain',
      'list_api_keys',
      'create_api_key',
      'revoke_api_key',
      'list_workspaces',
      'create_workspace',
      'switch_workspace',
      'scrape_product',
      'get_media_kit',
    ];

    for (const tool of expectedTools) {
      assert.ok(toolNames.includes(tool), `MCP server must include tool "${tool}"`);
    }
  });

  await t.test('executes tool call for get_profile', async () => {
    const callHandler = mcpServer._requestHandlers.get(CallToolRequestSchema.shape.method.value);
    assert.ok(callHandler);

    const res = await callHandler({
      method: 'tools/call',
      params: {
        name: 'get_profile',
        arguments: { username: 'alice' },
      },
    });

    assert.ok(!res.isError);
    assert.strictEqual(res.content[0].type, 'text');
    const parsed = JSON.parse(res.content[0].text);
    assert.strictEqual(parsed.profile.username, 'alice');
  });

  await t.test('executes tool call for add_link', async () => {
    const callHandler = mcpServer._requestHandlers.get(CallToolRequestSchema.shape.method.value);
    const res = await callHandler({
      method: 'tools/call',
      params: {
        name: 'add_link',
        arguments: { title: 'YouTube Channel', url: 'https://youtube.com/@channel', badge: 'NEW' },
      },
    });

    assert.ok(!res.isError);
    const parsed = JSON.parse(res.content[0].text);
    assert.strictEqual(parsed.link.title, 'YouTube Channel');
    assert.strictEqual(parsed.link.badge, 'NEW');
  });

  await t.test('executes tool call for get_analytics', async () => {
    const callHandler = mcpServer._requestHandlers.get(CallToolRequestSchema.shape.method.value);
    const res = await callHandler({
      method: 'tools/call',
      params: {
        name: 'get_analytics',
        arguments: { username: 'alice', range: '30d' },
      },
    });

    assert.ok(!res.isError);
    const parsed = JSON.parse(res.content[0].text);
    assert.strictEqual(parsed.totalViews, 4200);
    assert.strictEqual(parsed.ctr, '12.5');
  });

  await t.test('registers and reads MCP resources', async () => {
    const listResHandler = mcpServer._requestHandlers.get(ListResourcesRequestSchema.shape.method.value);
    const resList = await listResHandler({ method: 'resources/list', params: {} });
    assert.ok(resList.resources.length >= 3);

    const readResHandler = mcpServer._requestHandlers.get(ReadResourceRequestSchema.shape.method.value);
    const readResult = await readResHandler({
      method: 'resources/read',
      params: { uri: 'treeinbio://profile/alice' },
    });
    assert.strictEqual(readResult.contents[0].uri, 'treeinbio://profile/alice');
    const profileJson = JSON.parse(readResult.contents[0].text);
    assert.strictEqual(profileJson.profile.username, 'alice');
  });
});

test('TreeInBio CLI Runner Suite', async (t) => {
  await t.test('prints version when --version flag is provided', async () => {
    let logged = '';
    const originalLog = console.log;
    console.log = (...args) => {
      logged += args.join(' ');
    };

    try {
      const code = await runCli(['node', 'treeinbio', '--version']);
      assert.strictEqual(code, 0);
      assert.match(logged, /treeinbio v1\.0\.0/);
    } finally {
      console.log = originalLog;
    }
  });

  await t.test('prints help when --help flag is provided', async () => {
    let logged = '';
    const originalLog = console.log;
    console.log = (...args) => {
      logged += args.join(' ');
    };

    try {
      const code = await runCli(['node', 'treeinbio', '--help']);
      assert.strictEqual(code, 0);
      assert.match(logged, /Universal CLI & MCP Toolkit/);
      assert.match(logged, /treeinbio mcp start/);
    } finally {
      console.log = originalLog;
    }
  });

  await t.test('returns error code for unknown command', async () => {
    let loggedError = '';
    const originalErr = console.error;
    console.error = (...args) => {
      loggedError += args.join(' ');
    };

    try {
      const code = await runCli(['node', 'treeinbio', 'unknown_cmd_xyz']);
      assert.strictEqual(code, 1);
      assert.match(loggedError, /Unknown command "unknown_cmd_xyz"/);
    } finally {
      console.error = originalErr;
    }
  });
});
