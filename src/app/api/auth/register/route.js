import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import Profile from '@/models/Profile';
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth';
import { INITIAL_USER_PROFILE } from '@/constants/app';
import { consumeRateLimit } from '@/lib/rateLimit';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
const USERNAME_REGEX = /^[a-z0-9_-]{3,30}$/;

export async function POST(request) {
  try {
    const rate = consumeRateLimit(request, 'register', 5, 60 * 60 * 1000);
    if (!rate.allowed) return NextResponse.json({ success: false, error: 'Too many account creation attempts. Try again later.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } });
    await connectToDatabase();
    const body = await request.json();

    const { email, username, password, name } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ success: false, error: 'Email address is required.' }, { status: 400 });
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json({ success: false, error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (!username || !username.trim()) {
      return NextResponse.json({ success: false, error: 'Username is required.' }, { status: 400 });
    }

    const cleanUsername = username.toLowerCase().trim();
    if (!USERNAME_REGEX.test(cleanUsername)) {
      return NextResponse.json({
        success: false,
        error: 'Username must be between 3 and 30 characters (letters, numbers, hyphens, and underscores only).'
      }, { status: 400 });
    }

    if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
      return NextResponse.json({ success: false, error: 'Password must be between 12 and 128 characters.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = (name || cleanUsername).trim();

    // Check if user already exists
    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      return NextResponse.json({ success: false, error: 'An account with this email already exists.' }, { status: 409 });
    }

    const existingUsername = await User.findOne({ username: cleanUsername });
    if (existingUsername) {
      return NextResponse.json({ success: false, error: 'This username is already taken. Please choose another.' }, { status: 409 });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create User
    const newUser = await User.create({
      email: cleanEmail,
      username: cleanUsername,
      passwordHash,
      name: cleanName,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=52796F&color=FFFEFA&bold=true&size=128`,
    });

    // Create Initial Profile
    const initialProfile = await Profile.findOneAndUpdate(
      { username: cleanUsername },
      {
        $setOnInsert: {
          ...INITIAL_USER_PROFILE,
          username: cleanUsername,
          name: cleanName,
          title: cleanName,
          avatar: newUser.avatar,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    newUser.profiles = [initialProfile._id];
    newUser.activeProfileId = initialProfile._id;
    await newUser.save();

    // Sign JWT
    const token = signToken({
      id: newUser._id.toString(),
      username: newUser.username,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully!',
      user: {
        id: newUser._id.toString(),
        username: newUser.username,
        email: newUser.email,
        name: newUser.name,
        avatar: newUser.avatar,
      },
    }, { status: 201 });

    return setAuthCookie(response, token);
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
