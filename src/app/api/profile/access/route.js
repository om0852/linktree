import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Profile from '@/models/Profile';
import { toPublicProfile } from '@/lib/publicProfile';
import { consumeRateLimit } from '@/lib/rateLimit';
import bcrypt from 'bcryptjs';
import { hashPassword } from '@/lib/auth';

export async function POST(request) {
  const rate = consumeRateLimit(request, 'profile-access', 8, 15 * 60 * 1000);
  if (!rate.allowed) return NextResponse.json({ success: false, error: 'Too many attempts. Try again later.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } });
  try {
    const { username, passcode } = await request.json();
    if (typeof username !== 'string' || typeof passcode !== 'string' || passcode.length > 128) {
      return NextResponse.json({ success: false, error: 'Invalid passcode.' }, { status: 400 });
    }
    await connectToDatabase();
    const profile = await Profile.findOne({ username: username.toLowerCase().trim() }).lean();
    const storedPasscode = String(profile?.accessGate?.passcode || '');
    const validPasscode = storedPasscode.startsWith('$2')
      ? await bcrypt.compare(passcode.trim(), storedPasscode)
      : passcode.trim() === storedPasscode.trim();
    if (!profile?.accessGate?.enabled || profile.accessGate.type !== 'passcode' || !validPasscode) {
      return NextResponse.json({ success: false, error: 'Incorrect passcode.' }, { status: 403 });
    }
    if (storedPasscode && !storedPasscode.startsWith('$2')) {
      await Profile.updateOne({ _id: profile._id }, { $set: { 'accessGate.passcode': await hashPassword(storedPasscode) } });
    }
    return NextResponse.json({ success: true, profile: toPublicProfile(profile) }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to verify passcode.' }, { status: 400 });
  }
}
