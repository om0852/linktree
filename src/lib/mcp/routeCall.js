// MCP tools call the app's own route handlers in-process. The caller's
// credentials are forwarded, so every check (ownership, read-only keys,
// validation, sanitising) is exactly the one the Studio goes through.

const FORWARDED_HEADERS = ['authorization', 'x-api-key', 'x-forwarded-for', 'x-real-ip', 'user-agent'];

export class ToolError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Run `handler` (an exported GET/POST/... of a route module) as if the caller
 * had requested `path`. Returns the parsed JSON body; throws ToolError when
 * the route answers with an error.
 */
export async function callRoute(incoming, handler, { method = 'GET', path, query = {}, body, params } = {}) {
  const url = new URL(path, incoming.url);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }
  const headers = new Headers();
  for (const name of FORWARDED_HEADERS) {
    const value = incoming.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (body !== undefined) headers.set('content-type', 'application/json');

  const request = new Request(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const response = await handler(request, params ? { params: Promise.resolve(params) } : undefined);
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!response.ok || data?.success === false) {
    throw new ToolError(data?.error || data?.message || `Request failed (${response.status}).`, response.status);
  }
  return data;
}
