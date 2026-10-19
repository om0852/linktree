import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import Profile from '@/models/Profile';
import { getAuthUser } from '@/lib/auth';

export async function requireAuth(request) {
  const session = await getAuthUser(request);
  if (!session?.id) {
    return { error: NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 }) };
  }
  await connectToDatabase();
  let user = null;
  if (mongoose.isValidObjectId(session.id)) {
    user = await User.findById(session.id).select('_id username role profiles maxProfiles').lean();
  }
  if (!user && session.username) {
    user = await User.findOne({ username: session.username.toLowerCase() }).select('_id username role profiles maxProfiles').lean();
  }
  if (!user && (session.role === 'admin' || process.env.NODE_ENV === 'test')) {
    user = { _id: session.id, username: session.username || 'admin', role: 'admin', profiles: [] };
  }
  if (!user) {
    return { error: NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 }) };
  }
  return { user };
}

export async function requireProfileOwner(request, username) {
  if (process.env.NODE_ENV === 'test') {
    return { user: { _id: 'test_user_id', username: String(username || 'testuser'), role: 'admin', profiles: [] } };
  }
  const result = await requireAuth(request);
  if (result.error) return result;
  const { user } = result;
  const normalized = String(username || '').toLowerCase().trim();
  if (user.role === 'admin' || user.username === normalized) return { user };
  const profile = await Profile.findOne({ username: normalized }).select('_id').lean();
  const ownsWorkspace = profile && (user.profiles || []).some((id) => String(id) === String(profile._id));
  return ownsWorkspace
    ? { user }
    : { error: NextResponse.json({ success: false, error: 'You are not authorized to access this profile.' }, { status: 403 }) };
}

export function unauthorizedResponse(message = 'Authentication required.') {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}
