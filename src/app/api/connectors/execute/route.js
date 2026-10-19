import { NextResponse } from 'next/server';
import { getComposioClient, isComposioConfigured } from '@/lib/composio';
import { requireAuth } from '@/lib/authorization';

export async function POST(req) {
  try {
    const access = await requireAuth(req);
    if (access.error) return access.error;
    const authUser = access.user;
    const body = await req.json();
    const { toolSlug, params = {} } = body;
    const userId = authUser.username;

    if (!toolSlug) {
      return NextResponse.json({ error: 'toolSlug is required' }, { status: 400 });
    }

    if (!isComposioConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'COMPOSIO_API_KEY is required to execute platform actions.'
      }, { status: 400 });
    }

    const client = getComposioClient();
    const startTime = Date.now();

    const result = await client.tools.execute(toolSlug, {
      userId,
      arguments: params
    });

    const durationMs = Date.now() - startTime;
    const isSuccess = Boolean(result && result.successful !== false && !result.error);

    return NextResponse.json({
      success: isSuccess,
      toolSlug,
      userId,
      durationMs,
      result,
      error: !isSuccess ? (result?.error || 'Action execution was not successful. Ensure your account is connected.') : undefined,
    }, { status: isSuccess ? 200 : 400 });
  } catch (error) {
    console.error('Composio action execution failed:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message || 'Action execution failed'
    }, { status: 500 });
  }
}
