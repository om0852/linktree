import { NextResponse } from 'next/server';
import { getComposioClient, isComposioConfigured } from '@/lib/composio';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const toolkitSlug = searchParams.get('toolkitSlug');

    if (!toolkitSlug) {
      return NextResponse.json({ error: 'toolkitSlug query param is required' }, { status: 400 });
    }

    if (!isComposioConfigured()) {
      return NextResponse.json({
        configured: false,
        tools: [],
        error: 'COMPOSIO_API_KEY is missing'
      });
    }

    const client = getComposioClient();
    const rawTools = await client.tools.getRawComposioTools({ toolkits: [toolkitSlug] });

    const formattedTools = (rawTools || []).map(t => ({
      slug: t.slug,
      name: t.name || t.slug,
      description: t.description || '',
      inputParameters: t.inputParameters || { properties: {}, required: [] },
      scopes: t.scopes || [],
      isDeprecated: Boolean(t.isDeprecated)
    }));

    return NextResponse.json({
      success: true,
      toolkitSlug,
      total: formattedTools.length,
      tools: formattedTools
    });
  } catch (error) {
    console.error('Failed to fetch tools for toolkit:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch toolkit tools'
    }, { status: 500 });
  }
}
