import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Subscriber from '@/models/Subscriber';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, username } = body;

    if (!email || !email.includes('@')) {
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
