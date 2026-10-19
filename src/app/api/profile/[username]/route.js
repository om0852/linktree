import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Profile from '@/models/Profile';
import { toPublicProfile } from '@/lib/publicProfile';

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    const { username } = await params;

    if (!username) {
      return NextResponse.json({ success: false, message: 'Username is required' }, { status: 400 });
    }

    const normalized = username.toLowerCase().trim();
    const profile = await Profile.findOne({ username: normalized }).lean();

    if (!profile) {
      return NextResponse.json({ success: false, message: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, profile: toPublicProfile(profile) });
  } catch (error) {
    console.error('API Profile [username] GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
