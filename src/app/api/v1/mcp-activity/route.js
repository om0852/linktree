import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import McpActivity from '@/models/McpActivity';
import { requireAuth } from '@/lib/authorization';

// GET /api/v1/mcp-activity — the signed-in owner's recent AI changes (newest
// first). Session only: an assistant cannot read or tidy its own trail.
export async function GET(request) {
  try {
    const access = await requireAuth(request);
    if (access.error) return access.error;
    if (access.session?.isApiKey) {
      return NextResponse.json({ success: false, error: 'Sign in to view AI activity.' }, { status: 403 });
    }
    await connectToDatabase();
    const entries = await McpActivity.find({ accountUsername: access.user.username })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('-before')
      .lean();
    // Only the newest successful page edit per workspace can be undone safely.
    const latestPerWorkspace = new Set();
    const activity = entries.map((entry) => {
      const pageEdit = entry.ok && entry.afterUpdatedAt && !entry.undoneAt;
      const undoable = pageEdit && !latestPerWorkspace.has(entry.workspace);
      if (entry.ok && entry.afterUpdatedAt) latestPerWorkspace.add(entry.workspace);
      return {
        id: entry._id.toString(),
        tool: entry.tool,
        workspace: entry.workspace,
        keyName: entry.apiKeyName,
        args: entry.args,
        ok: entry.ok,
        error: entry.error || undefined,
        createdAt: entry.createdAt,
        undoneAt: entry.undoneAt || undefined,
        undoable: Boolean(undoable),
      };
    });
    return NextResponse.json({ success: true, activity });
  } catch (error) {
    console.error('MCP activity GET error:', error);
    return NextResponse.json({ success: false, error: 'Could not load AI activity.' }, { status: 500 });
  }
}
