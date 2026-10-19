import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Subscriber from '@/models/Subscriber';
import Profile from '@/models/Profile';
import { consumeRateLimit } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const rate = consumeRateLimit(request, 'newsletter', 8, 60 * 60 * 1000);
    if (!rate.allowed) return NextResponse.json({ success: false, message: 'Too many requests. Try again later.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } });
    const body = await request.json().catch(() => ({}));
    const { email, username } = body;

    if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { success: false, message: 'Valid email address is required.' },
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

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.toLowerCase().trim();
    const profile = await Profile.findOne({ username: normalizedUsername }).select('widgets.hasNewsletter').lean();
    if (!profile || !profile.widgets?.hasNewsletter) return NextResponse.json({ success: false, message: 'Newsletter signup is not available.' }, { status: 404 });

    // Check if already subscribed
    const existing = await Subscriber.findOne({
      profileUsername: normalizedUsername,
      email: normalizedEmail,
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'You are already subscribed to this newsletter!',
        alreadySubscribed: true,
      });
    }

    await Subscriber.create({
      profileUsername: normalizedUsername,
      email: normalizedEmail,
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to the newsletter!',
    });
  } catch (error) {
    console.error('API Newsletter error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
