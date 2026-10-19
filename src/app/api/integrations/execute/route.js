import { NextResponse } from 'next/server';
import { getComposioClient, isComposioConfigured } from '@/lib/composio';

export async function POST(req) {
  try {
    const { userId = 'creator_default', toolSlug, params = {} } = await req.json();

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
      dangerouslySkipVersionCheck: true,
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
