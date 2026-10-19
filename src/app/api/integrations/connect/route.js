import { NextResponse } from 'next/server';
import { getComposioClient, isComposioConfigured, createAuthorizationLink } from '@/lib/composio';
import { getAuthUser } from '@/lib/auth';

export async function POST(req) {
  try {
    const authUser = await getAuthUser(req);
    const body = await req.json();
    const { 
      userId = authUser?.username || 'creator', 
      toolkitSlug, 
      apiKeyOverride,
      callbackUrl 
    } = body;

    if (!toolkitSlug) {
      return NextResponse.json({ error: 'toolkitSlug is required' }, { status: 400 });
    }

    const hasKey = isComposioConfigured() || Boolean(apiKeyOverride && apiKeyOverride.trim());

    if (!hasKey) {
      return NextResponse.json({
        success: false,
        requiresApiKey: true,
        error: 'COMPOSIO_API_KEY is not configured yet. Paste your key in the header or in .env.local to test real OAuth flows!'
      }, { status: 400 });
    }

    try {
      const client = getComposioClient(apiKeyOverride);

      // Use modern Composio /api/v3/connected_accounts/link API
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
