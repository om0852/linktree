import { NextResponse } from 'next/server';
import { getComposioClient, isComposioConfigured, createAuthorizationLink } from '@/lib/composio';
import { requireAuth, requireProfileOwner } from '@/lib/authorization';

export async function POST(req) {
  try {
    const body = await req.json();
    const { toolkitSlug, userId: requestedUser } = body;
    const access = requestedUser
      ? await requireProfileOwner(req, requestedUser)
      : await requireAuth(req);
    if (access.error) return access.error;
    const userId = (requestedUser || access.user.username).toLowerCase().trim();

    if (!toolkitSlug) {
      return NextResponse.json({ error: 'toolkitSlug is required' }, { status: 400 });
    }

    const hasKey = isComposioConfigured();

    if (!hasKey) {
      return NextResponse.json({
        success: false,
        requiresApiKey: true,
        error: 'COMPOSIO_API_KEY is not configured yet. Paste your key in the header or in .env.local to test real OAuth flows!'
      }, { status: 400 });
    }

    try {
      const client = getComposioClient();

      // Use modern Composio /api/v3/connected_accounts/link API
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const callbackUrl = new URL('/connectors', appUrl).toString();
      const connectionRequest = await createAuthorizationLink(client, userId, toolkitSlug, callbackUrl);

      return NextResponse.json({
        success: true,
        connectionId: connectionRequest.id,
        status: connectionRequest.status,
        redirectUrl: connectionRequest.redirectUrl,
        toolkitSlug,
        userId
      });
    } catch (apiError) {
      console.error(`Composio authorization error for ${toolkitSlug}:`, apiError.message);
      return NextResponse.json({
        success: false,
        error: apiError.message || 'Failed to initiate Composio authorization'
      }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
