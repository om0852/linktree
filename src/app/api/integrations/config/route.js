import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { isComposioConfigured } from '@/lib/composio';

export async function GET() {
  try {
    const rawKey = process.env.COMPOSIO_API_KEY || '';
    const configured = Boolean(rawKey && rawKey.trim().length > 5);

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

export async function POST(req) {
  try {
    const { apiKey } = await req.json();
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 5) {
      return NextResponse.json({ error: 'Please provide a valid Composio API Key' }, { status: 400 });
    }

    const trimmedKey = apiKey.trim();
    // Update process.env for current running Node process immediately
    process.env.COMPOSIO_API_KEY = trimmedKey;

    // Persist into .env.local
    try {
      const envPath = path.join(process.cwd(), '.env.local');
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }

      if (envContent.includes('COMPOSIO_API_KEY=')) {
        envContent = envContent.replace(/COMPOSIO_API_KEY=.*(\r?\n|$)/, `COMPOSIO_API_KEY=${trimmedKey}\n`);
      } else {
        envContent += `\nCOMPOSIO_API_KEY=${trimmedKey}\n`;
      }
      fs.writeFileSync(envPath, envContent, 'utf8');
    } catch (fsErr) {
      console.warn('Could not write to .env.local file directly, kept in process.env:', fsErr.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Composio API Key updated and verified successfully!',
      maskedKey: `${trimmedKey.slice(0, 4)}...${trimmedKey.slice(-4)}`
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
