import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import McpActivity from '@/models/McpActivity';
import Profile from '@/models/Profile';
import { requireAuth, userOwnsProfile } from '@/lib/authorization';
import * as profileRoute from '@/app/api/profile/route';

// POST /api/v1/mcp-activity/:id/undo — put the page back the way it was
// before that AI change. Refused when the page changed afterwards (by the
// Studio or another assistant), so newer work is never overwritten.
export async function POST(request, { params }) {
  try {
    const access = await requireAuth(request);
    if (access.error) return access.error;
    if (access.session?.isApiKey) {
      return NextResponse.json({ success: false, error: 'Sign in to undo AI changes.' }, { status: 403 });
    }
    await connectToDatabase();
    const { id } = await params;
    const entry = await McpActivity.findById(id).lean();
    if (!entry || entry.accountUsername !== access.user.username) {
      return NextResponse.json({ success: false, error: 'Activity not found.' }, { status: 404 });
    }
    if (!entry.ok || !entry.before || !entry.afterUpdatedAt) {
      return NextResponse.json({ success: false, error: 'This change cannot be undone.' }, { status: 400 });
    }
    if (entry.undoneAt) return NextResponse.json({ success: false, error: 'Already undone.' }, { status: 409 });
    if (!(await userOwnsProfile(access.user, entry.workspace))) {
      return NextResponse.json({ success: false, error: 'You no longer own this workspace.' }, { status: 403 });
    }

    const current = await Profile.findOne({ username: entry.workspace }).select('updatedAt').lean();
    if (!current || new Date(current.updatedAt).getTime() !== new Date(entry.afterUpdatedAt).getTime()) {
      return NextResponse.json({
        success: false,
        error: 'The page has changed since this AI edit, so undoing it would overwrite newer work.',
      }, { status: 409 });
    }

    // Save the earlier version through the normal profile route (same checks
    // and sanitising as the Studio's Publish).
    const restore = new Request(new URL('/api/profile', request.url), {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: request.headers.get('cookie') || '' },
      body: JSON.stringify(entry.before),
    });
    const response = await profileRoute.POST(restore);
    const data = await response.json();
    if (!response.ok || !data.success) {
      return NextResponse.json({ success: false, error: data.error || 'Undo failed.' }, { status: response.status || 500 });
    }
    await McpActivity.updateOne({ _id: entry._id }, { $set: { undoneAt: new Date() } });
    return NextResponse.json({ success: true, message: 'Change undone.' });
  } catch (error) {
    console.error('MCP undo error:', error);
    return NextResponse.json({ success: false, error: 'Undo failed.' }, { status: 500 });
  }
}
