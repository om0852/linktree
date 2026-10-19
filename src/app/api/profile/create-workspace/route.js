import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import User from '@/models/User';
import Profile from '@/models/Profile';
import { getAuthUser } from '@/lib/auth';
import { INITIAL_USER_PROFILE } from '@/constants/app';

export async function POST(req) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Sign-in required' }, { status: 401 });
    }
    await connectMongo();

    const body = await req.json();
    const { username, name, title = 'Creator & Brand', niche = 'creator' } = body;

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ success: false, error: 'Username is required' }, { status: 400 });
    }

    const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
    if (cleanUsername.length < 2) {
      return NextResponse.json({ success: false, error: 'Username must be at least 2 characters long' }, { status: 400 });
    }

    // Check if username taken
    const existing = await Profile.findOne({ username: cleanUsername });
    if (existing) {
      return NextResponse.json({ success: false, error: `@${cleanUsername} is already registered. Please choose another.` }, { status: 409 });
    }

    const targetUserId = authUser.id || authUser.userId || authUser._id || authUser.sub;
    let user = targetUserId ? await User.findById(targetUserId) : null;
    if (!user && authUser.username) {
      user = await User.findOne({ username: authUser.username.toLowerCase() });
    }
    if (!user) {
      return NextResponse.json({ success: false, error: 'User account not found' }, { status: 404 });
    }

    const maxProfiles = user.maxProfiles || 10;
    const currentProfilesCount = (user.profiles || []).length;
    if (currentProfilesCount >= maxProfiles && user.role !== 'admin' && user.role !== 'agency') {
      // Automatically upgrade user role to agency to allow multi-brand workspace management
      user.role = 'agency';
    }

    // Create new profile with clean defaults
    const newProfile = await Profile.create({
      ...INITIAL_USER_PROFILE,
      username: cleanUsername,
      name: name || cleanUsername,
      title: title || 'Creator & Brand',
      bio: `Welcome to the official @${cleanUsername} TreeInBio page.`,
      niche,
      designSettings: {
        ...(INITIAL_USER_PROFILE.designSettings || {}),
        buttonRoundness: 'pill',
        buttonShadow: 'soft',
        customColors: {},
      },
    });

    // Add to user profiles and set as active
    user.profiles = user.profiles || [];
    user.profiles.push(newProfile._id);
    user.activeProfileId = newProfile._id;
    await user.save();

    return NextResponse.json({
      success: true,
      message: `New brand workspace @${newProfile.username} created successfully!`,
      profile: newProfile.toObject ? newProfile.toObject() : newProfile,
    });
  } catch (error) {
    console.error('Create workspace error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
