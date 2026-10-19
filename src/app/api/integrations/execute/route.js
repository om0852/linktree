import { NextResponse } from 'next/server';
import { getComposioClient, isComposioConfigured } from '@/lib/composio';
import { requireAuth, requireProfileOwner } from '@/lib/authorization';

export async function POST(req) {
  try {
    const body = await req.json();
    const { toolSlug, params = {}, userId: requestedUser } = body;
    const access = requestedUser
      ? await requireProfileOwner(req, requestedUser)
      : await requireAuth(req);
    if (access.error) return access.error;
    const userId = (requestedUser || access.user.username).toLowerCase().trim();

    if (!toolSlug) {
      return NextResponse.json({ error: 'toolSlug is required' }, { status: 400 });
    }

    if (!isComposioConfigured()) {
      return NextResponse.json({
        success: false,
        requiresApiKey: true,
        error: 'COMPOSIO_API_KEY is required to execute live platform actions.'
      }, { status: 400 });
    }

    const client = getComposioClient();
    const result = await client.tools.execute(toolSlug, {
      userId,
      arguments: params
    });

    return NextResponse.json({
      success: true,
      toolSlug,
      userId,
      result
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Tool execution failed'
    }, { status: 500 });
  }
}
