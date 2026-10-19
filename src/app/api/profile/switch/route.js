import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import User from '@/models/User';
import Profile from '@/models/Profile';
import { requireAuth } from '@/lib/authorization';
import { toOwnerProfile } from '@/lib/publicProfile';

export async function POST(req) {
  try {
    const access = await requireAuth(req);
    if (access.error) return access.error;
    const authUser = access.user;
    await connectMongo();

    const body = await req.json();
    const { profileId, username } = body;

    let targetProfile = null;
    if (profileId) {
      targetProfile = await Profile.findById(profileId).lean();
    } else if (username) {
      targetProfile = await Profile.findOne({ username: username.toLowerCase().trim() }).lean();
    }

    if (!targetProfile) {
      return NextResponse.json({ success: false, error: 'Target workspace profile not found' }, { status: 404 });
    }
    const ownsProfile = authUser.role === 'admin' || authUser.username === targetProfile.username ||
      (authUser.profiles || []).some((id) => String(id) === String(targetProfile._id));
    if (!ownsProfile) return NextResponse.json({ success: false, error: 'You are not authorized to switch to this workspace.' }, { status: 403 });

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
      profile: toOwnerProfile(targetProfile),
    });
  } catch (error) {
    console.error('Workspace switch error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
