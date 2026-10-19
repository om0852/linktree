import { NextResponse } from 'next/server';
import { isComposioConfigured } from '@/lib/composio';

export async function GET() {
  try {
    const rawKey = process.env.COMPOSIO_API_KEY || '';
    const configured = isComposioConfigured();

    let maskedKey = null;
    if (configured) {
      const trimmed = rawKey.trim();
      maskedKey = trimmed.length > 8 
        ? `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`
        : 'ak_****';
    }

    return NextResponse.json({
      configured,
      maskedKey,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
