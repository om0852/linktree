import { NextResponse } from 'next/server';
import { getComposioClient, isComposioConfigured, createAuthorizationLink } from '@/lib/composio';
import { requireAuth } from '@/lib/authorization';

export async function POST(req) {
  try {
    const access = await requireAuth(req);
    if (access.error) return access.error;
    const body = await req.json();
    const { toolkitSlug } = body;
    const userId = access.user.username;

    if (!toolkitSlug) {
      return NextResponse.json({ error: 'toolkitSlug is required' }, { status: 400 });
    }

    if (!isComposioConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'COMPOSIO_API_KEY is not configured in .env.local.'
      }, { status: 400 });
    }

    try {
      const client = getComposioClient();
      const redirectTarget = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/connectors?connected=${encodeURIComponent(toolkitSlug)}`;
      
      const connectionRequest = await createAuthorizationLink(client, userId, toolkitSlug, redirectTarget);

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
