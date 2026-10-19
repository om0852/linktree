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
    const targetUserId = authPayload.id || authPayload.userId || authPayload._id;
    let user = targetUserId 
      ? await User.findById(targetUserId).select('-passwordHash').lean() 
      : null;

    if (!user) {
      user = await User.findOne({ username: authPayload.username.toLowerCase() }).select('-passwordHash').lean();
    }

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null, profile: null });
    }

    // Retrieve active workspace profile if activeProfileId is configured
    let profile = null;
    if (user.activeProfileId) {
      profile = await Profile.findById(user.activeProfileId).lean();
    }
    // Fallback to primary account profile
    if (!profile) {
      profile = await Profile.findOne({ username: user.username.toLowerCase() }).lean();
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        activeProfileId: user.activeProfileId?.toString() || profile?._id?.toString() || null,
        activeUsername: profile?.username || user.username,
      },
      profile: profile || null,
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 500 });
  }
}
