import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { verifyPassword, signToken, setAuthCookie } from '@/lib/auth';
import { consumeRateLimit } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const rate = consumeRateLimit(request, 'login', 10, 15 * 60 * 1000);
    if (!rate.allowed) return NextResponse.json({ success: false, error: 'Too many sign-in attempts. Try again later.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } });
    await connectToDatabase();
    const body = await request.json();

    const { emailOrUsername, password } = body;

    if (typeof emailOrUsername !== 'string' || !emailOrUsername.trim()) {
      return NextResponse.json({ success: false, error: 'Email or username is required.' }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ success: false, error: 'Password is required.' }, { status: 400 });
    }

    const identifier = emailOrUsername.toLowerCase().trim();

    // Query user by email OR username
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid email/username or password.' }, { status: 401 });
    }

    // Verify password hash
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid email/username or password.' }, { status: 401 });
    }

    // Sign JWT
    const token = signToken({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Logged in successfully!',
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    });

    return setAuthCookie(response, token);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
