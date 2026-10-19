import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import Profile from '@/models/Profile';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const authPayload = await getAuthUser(request);
    if (!authPayload || !authPayload.username) {
      return NextResponse.json({ authenticated: false, user: null, profile: null });
    }

    await connectToDatabase();
    const user = await User.findOne({ username: authPayload.username.toLowerCase() }).select('-passwordHash').lean();

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null, profile: null });
    }

    const profile = await Profile.findOne({ username: user.username }).lean();

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
      profile: profile || null,
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 500 });
  }
}
