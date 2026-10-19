import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import User from '@/models/User';
import Profile from '@/models/Profile';
import { getAuthUser } from '@/lib/auth';

export async function GET(req) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Sign-in required' }, { status: 401 });
    }
    await connectMongo();

    const user = await User.findById(authUser.userId || authUser._id).lean();
    if (!user) {
      return NextResponse.json({ success: false, error: 'User account not found' }, { status: 404 });
    }

    // Collect profile IDs
    const profileIds = Array.isArray(user.profiles) ? [...user.profiles] : [];

    // Find primary profile by username
    const primaryProfile = await Profile.findOne({ username: user.username.toLowerCase() }).lean();
    if (primaryProfile && !profileIds.some(id => id.toString() === primaryProfile._id.toString())) {
      profileIds.unshift(primaryProfile._id);
    }

    // Fetch all profiles
    const profiles = await Profile.find({ _id: { $in: profileIds } })
      .select('username name title avatar verified layout theme')
      .lean();

    return NextResponse.json({
      success: true,
      role: user.role || 'creator',
      activeProfileId: user.activeProfileId || primaryProfile?._id || null,
      maxProfiles: user.maxProfiles || 10,
      workspaces: profiles.map(p => ({
        id: p._id.toString(),
        username: p.username,
        name: p.name,
        title: p.title,
        avatar: p.avatar,
        verified: p.verified,
        theme: p.theme,
      })),
    });
  } catch (error) {
    console.error('Workspaces list error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
