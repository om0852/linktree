import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { getAuthUser } from '@/lib/auth';
import { createTreeInBioMcpServer } from '@/lib/mcp/server';

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

async function handle(request) {
  const session = await getAuthUser(request);
  // Only API keys: browser cookies must not turn a page visit into tool access.
  if (!session?.isApiKey) return unauthorized();

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
