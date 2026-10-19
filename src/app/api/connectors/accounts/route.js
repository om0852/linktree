import { NextResponse } from 'next/server';
import { getComposioClient, isComposioConfigured } from '@/lib/composio';
import { requireAuth, requireProfileOwner } from '@/lib/authorization';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedUser = searchParams.get('userId') || searchParams.get('username');
    const access = requestedUser
      ? await requireProfileOwner(req, requestedUser)
      : await requireAuth(req);
    if (access.error) return access.error;
    const userId = (requestedUser || access.user.username).toLowerCase().trim();

    if (!isComposioConfigured()) {
      return NextResponse.json({
        configured: false,
        accounts: [],
        error: 'COMPOSIO_API_KEY is not configured in .env.local'
      });
    }

    try {
      const client = getComposioClient();
      const accountsList = await client.connectedAccounts.list({
        userIds: [userId]
      });

      return NextResponse.json({
        configured: true,
        userId,
        accounts: accountsList.items || []
      });
    } catch (sdkError) {
      console.warn('Composio accounts list error:', sdkError.message);
      return NextResponse.json({
        configured: true,
        userId,
        accounts: [],
        warning: sdkError.message
      });
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json();
    const { accountId, userId: requestedUser } = body;
    const access = requestedUser
      ? await requireProfileOwner(req, requestedUser)
      : await requireAuth(req);
    if (access.error) return access.error;
    const userId = (requestedUser || access.user.username).toLowerCase().trim();

    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
    }

    if (!isComposioConfigured()) {
      return NextResponse.json({ error: 'COMPOSIO_API_KEY is not configured' }, { status: 400 });
    }

    const client = getComposioClient();
    const accounts = await client.connectedAccounts.list({ userIds: [userId] });
    if (!(accounts.items || []).some((account) => String(account.id || account.nanoid) === String(accountId))) {
      return NextResponse.json({ error: 'Connected account not found for this user.' }, { status: 404 });
    }
    await client.connectedAccounts.delete(accountId);

    return NextResponse.json({
      success: true,
      message: 'Account successfully disconnected from Composio'
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
