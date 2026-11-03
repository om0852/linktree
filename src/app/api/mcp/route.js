import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { getAuthUser } from '@/lib/auth';
import { createTreeInBioMcpServer } from '@/lib/mcp/server';
import { consumeSharedQuota } from '@/lib/sharedRateLimit';

// Remote MCP endpoint (Streamable HTTP). Any MCP client connects with
//   URL:    https://<host>/api/mcp
//   Header: Authorization: Bearer tree_live_...
// Stateless: every request gets its own server, so it scales like any route.
export const dynamic = 'force-dynamic';

function unauthorized() {
  return new Response(JSON.stringify({
    jsonrpc: '2.0',
    error: { code: -32001, message: 'Missing or invalid API key. Create one on the AI Assistants page and send it as "Authorization: Bearer <key>".' },
    id: null,
  }), {
    status: 401,
    headers: { 'content-type': 'application/json', 'www-authenticate': 'Bearer realm="treeinbio"' },
  });
}

// 120 requests a minute, 5,000 a day per key (an assistant uses one request
// per tool call, plus a couple to connect).
const MCP_LIMITS = [
  { windowMs: 60 * 1000, max: 120 },
  { windowMs: 24 * 60 * 60 * 1000, max: 5000 },
];

function tooManyRequests(retryAfterSeconds) {
  return new Response(JSON.stringify({
    jsonrpc: '2.0',
    error: { code: -32029, message: `Rate limit reached for this API key. Try again in ${retryAfterSeconds} seconds.` },
    id: null,
  }), { status: 429, headers: { 'content-type': 'application/json', 'retry-after': String(retryAfterSeconds) } });
}

async function handle(request) {
  const session = await getAuthUser(request);
  // Only personal API keys: browser cookies must not turn a page visit into
  // tool access, and the platform master key never drives an assistant.
  if (!session?.isApiKey || session.isMasterKey) return unauthorized();

  // Per key, across all server instances: a leaked key or a looping
  // assistant cannot hammer the API.
  const quota = await consumeSharedQuota(`mcp:${session.apiKeyId}`, MCP_LIMITS);
  if (!quota.allowed) return tooManyRequests(quota.retryAfterSeconds);

  const server = createTreeInBioMcpServer({ request, session });
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  try {
    return await transport.handleRequest(request);
  } finally {
    // Stateless: the server lives for this one request.
    await server.close().catch(() => {});
  }
}

export const POST = handle;
export const GET = handle;
export const DELETE = handle;
