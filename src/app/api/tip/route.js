import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Tip from '@/models/Tip';
import Profile from '@/models/Profile';
import { consumeRateLimit } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const rate = consumeRateLimit(request, 'tip-intent', 5, 60 * 60 * 1000);
    if (!rate.allowed) return NextResponse.json({ success: false, message: 'Too many requests. Try again later.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } });
    const body = await request.json().catch(() => ({}));
    const { username, amount, senderName, message } = body;

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Valid tip amount is required.' },
        { status: 400 }
      );
    }

    if (!username) {
      return NextResponse.json(
        { success: false, message: 'Creator username is required.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedUsername = username.toLowerCase().trim();
    const profile = await Profile.findOne({ username: normalizedUsername }).select('widgets.hasTipJar').lean();
    if (!profile || !profile.widgets?.hasTipJar) return NextResponse.json({ success: false, message: 'Tips are not enabled for this creator.' }, { status: 404 });

    const tip = await Tip.create({
      profileUsername: normalizedUsername,
      amount: parsedAmount,
      senderName: senderName?.trim() || 'Generous Supporter',
      message: message?.trim() || '',
      status: 'pending',
    });

    return NextResponse.json({
      success: true,
      message: `Tip of $${parsedAmount.toFixed(2)} recorded as pending. Payment has not been processed.`,
      tip,
    });
  } catch (error) {
    console.error('API Tip error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
