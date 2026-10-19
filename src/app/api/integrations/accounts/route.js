import { NextResponse } from 'next/server';
import { getComposioClient, isComposioConfigured } from '@/lib/composio';
import { requireAuth } from '@/lib/authorization';

export async function GET(req) {
  try {
    const access = await requireAuth(req);
    if (access.error) return access.error;
    const authUser = access.user;
    const userId = authUser.username;

    if (!isComposioConfigured()) {
      return NextResponse.json({
        configured: false,
        accounts: []
      });
    }

    try {
      const client = getComposioClient();
      const accountsList = await client.connectedAccounts.list({
        userIds: [userId]
      });

      return NextResponse.json({
        configured: true,
        accounts: accountsList.items || []
      });
    } catch (sdkError) {
      console.warn('Could not list connected accounts from Composio:', sdkError.message);
      return NextResponse.json({
        configured: true,
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
    const access = await requireAuth(req);
    if (access.error) return access.error;
    const body = await req.json();
    const { accountId } = body;

    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
    }

    if (!isComposioConfigured()) {
      return NextResponse.json({ error: 'COMPOSIO_API_KEY is not configured in .env.local' }, { status: 400 });
    }

    const client = getComposioClient();
    const accounts = await client.connectedAccounts.list({ userIds: [access.user.username] });
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
