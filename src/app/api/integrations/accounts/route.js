import { NextResponse } from 'next/server';
import { getComposioClient, isComposioConfigured } from '@/lib/composio';
import { getAuthUser } from '@/lib/auth';

export async function GET(req) {
  try {
    const authUser = await getAuthUser(req);
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || authUser?.username || 'creator';

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
    const body = await req.json();
    const { accountId } = body;

    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
    }

    if (!isComposioConfigured()) {
      return NextResponse.json({ error: 'COMPOSIO_API_KEY is not configured in .env.local' }, { status: 400 });
    }

    const client = getComposioClient();
    await client.connectedAccounts.delete(accountId);

    return NextResponse.json({
      success: true,
      message: 'Account successfully disconnected from Composio'
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
