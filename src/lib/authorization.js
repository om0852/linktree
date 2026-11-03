import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import Profile from '@/models/Profile';
import { getAuthUser } from '@/lib/auth';
import { canAccessProfile } from '@/lib/profileOwnership';

// API keys carry scopes: 'read' keys may only make read requests; 'write'
// and '*' keys may do everything an owner can.
export function apiKeyCanWrite(session) {
  const perms = Array.isArray(session?.permissions) ? session.permissions : ['*'];
  return perms.includes('*') || perms.includes('write');
}

export async function requireAuth(request) {
  const session = await getAuthUser(request);
  if (!session?.id) {
    return { error: NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 }) };
  }
  const method = String(request?.method || 'GET').toUpperCase();
  if (session.isApiKey && !['GET', 'HEAD', 'OPTIONS'].includes(method) && !apiKeyCanWrite(session)) {
    return { error: NextResponse.json({ success: false, error: 'This API key is read-only.' }, { status: 403 }) };
  }
  await connectToDatabase();
  let user = null;
  if (mongoose.isValidObjectId(session.id)) {
    user = await User.findById(session.id).select('_id username role profiles maxProfiles').lean();
  }
  if (!user && session.username) {
    user = await User.findOne({ username: session.username.toLowerCase() }).select('_id username role profiles maxProfiles').lean();
  }
  if (!user && (session.role === 'admin' || session.isMasterKey || process.env.NODE_ENV === 'test')) {
    user = { _id: session.id, username: session.username || 'admin', role: 'admin', profiles: [] };
  }
  if (!user && session.isApiKey) {
    user = { _id: session.id, username: session.username, role: session.role || 'creator', profiles: [] };
  }
  if (!user) {
    return { error: NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 }) };
  }
  return { user, session };
}

export async function requireProfileOwner(request, username) {
  const result = await requireAuth(request);
  if (result.error) return result;
  const { user } = result;
  const normalized = String(username || '').toLowerCase().trim();
  if (canAccessProfile(user, normalized)) return { user };
  const profile = await Profile.findOne({ username: normalized }).select('_id').lean();
  return canAccessProfile(user, normalized, profile?._id)
    ? { user }
    : { error: NextResponse.json({ success: false, error: 'You are not authorized to access this profile.' }, { status: 403 }) };
}

/** Whether `user` may manage the workspace (profile) `username`: own account, linked workspace or admin. */
export async function userOwnsProfile(user, username) {
  const normalized = String(username || '').toLowerCase().trim();
  if (!normalized) return false;
  if (canAccessProfile(user, normalized)) return true;
  const profile = await Profile.findOne({ username: normalized }).select('_id').lean();
  return canAccessProfile(user, normalized, profile?._id);
}

export function unauthorizedResponse(message = 'Authentication required.') {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}
