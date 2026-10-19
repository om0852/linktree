import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import User from '@/models/User';
import Profile from '@/models/Profile';
import { getAuthUser } from '@/lib/auth';

export async function POST(req) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Sign-in required' }, { status: 401 });
    }
    await connectMongo();

    const body = await req.json();
    const { profileId, username } = body;

    let targetProfile = null;
    if (profileId) {
      targetProfile = await Profile.findById(profileId);
    } else if (username) {
      targetProfile = await Profile.findOne({ username: username.toLowerCase().trim() });
    }

    if (!targetProfile) {
      return NextResponse.json({ success: false, error: 'Target workspace profile not found' }, { status: 404 });
    }

    // Update active profile on user document
    const targetUserId = authUser.id || authUser.userId || authUser._id || authUser.sub;
    let updatedUser = targetUserId 
      ? await User.findByIdAndUpdate(
          targetUserId,
          {
            $set: { activeProfileId: targetProfile._id },
            $addToSet: { profiles: targetProfile._id }
          },
          { new: true }
        )
      : null;

    if (!updatedUser && authUser.username) {
      await User.findOneAndUpdate(
        { username: authUser.username.toLowerCase() },
        {
          $set: { activeProfileId: targetProfile._id },
          $addToSet: { profiles: targetProfile._id }
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Switched active workspace to @${targetProfile.username}`,
      profile: targetProfile,
    });
  } catch (error) {
    console.error('Workspace switch error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
