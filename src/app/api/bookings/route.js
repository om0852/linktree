import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Profile from '@/models/Profile';
import { getAuthUser } from '@/lib/auth';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^(\+?[0-9\s\-().]{7,20})$/;

// Helper to generate a realistic meeting room link
function generateMeetingLink(platform, clientName, creatorUsername) {
  const code1 = Math.random().toString(36).substring(2, 5);
  const code2 = Math.random().toString(36).substring(2, 6);
  const code3 = Math.random().toString(36).substring(2, 5);

  if (platform === 'zoom') {
    const zoomId = Math.floor(1000000000 + Math.random() * 9000000000);
    return `https://zoom.us/j/${zoomId}?pwd=tb${code1}`;
  }
  if (platform === 'phone') {
    return 'Phone Conference / Direct Dial';
  }
  // Default: Google Meet
  return `https://meet.google.com/${code1}-${code2}-${code3}`;
}

export async function GET(req) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const rawCreator = searchParams.get('creator') || searchParams.get('username');
    const date = searchParams.get('date');

    const authUser = await getAuthUser(req);
    let creatorUsername = rawCreator ? rawCreator.toLowerCase().trim() : authUser?.username;

    if (!creatorUsername) {
      return NextResponse.json({ error: 'creator query parameter or authenticated session is required' }, { status: 400 });
    }

    if (authUser && authUser.username !== creatorUsername && authUser.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'You are not authorized to view bookings for this creator.' }, { status: 403 });
    }

    const query = { creatorUsername, status: { $ne: 'cancelled' } };
    if (date) {
      query.date = date;
    }

    const bookings = await Booking.find(query).sort({ date: 1, timeSlot: 1 }).lean();

    return NextResponse.json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error('API Bookings GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const {
      creatorUsername,
      clientName,
      clientEmail,
      clientPhone = '',
      topic = '',
      date,
      timeSlot,
      durationMinutes = 30,
      price = 'Free',
      platform = 'google_meet',
      timezone = 'UTC',
    } = body;

    // 1. Validate required fields
    if (!creatorUsername || !creatorUsername.trim()) {
      return NextResponse.json({ success: false, error: 'Creator username is required' }, { status: 400 });
    }
    if (!clientName || !clientName.trim()) {
      return NextResponse.json({ success: false, error: 'Your full name is required' }, { status: 400 });
    }
    if (!clientEmail || !clientEmail.trim()) {
      return NextResponse.json({ success: false, error: 'Email address is required' }, { status: 400 });
    }
    if (!EMAIL_REGEX.test(clientEmail.trim())) {
      return NextResponse.json({ success: false, error: 'Please provide a valid email address' }, { status: 400 });
    }
    if (clientPhone && clientPhone.trim() && !PHONE_REGEX.test(clientPhone.trim())) {
      return NextResponse.json({ success: false, error: 'Please provide a valid phone number or leave blank' }, { status: 400 });
    }
    if (!date || !date.trim()) {
      return NextResponse.json({ success: false, error: 'Meeting date is required' }, { status: 400 });
    }
    if (!timeSlot || !timeSlot.trim()) {
      return NextResponse.json({ success: false, error: 'Meeting time slot is required' }, { status: 400 });
    }

    const normalizedCreator = creatorUsername.toLowerCase().trim();
    const normalizedEmail = clientEmail.toLowerCase().trim();

    // 2. Verify creator profile exists
    const profile = await Profile.findOne({ username: normalizedCreator }).lean();
    if (!profile) {
      return NextResponse.json({ success: false, error: `Creator @${normalizedCreator} was not found` }, { status: 404 });
    }

    // 3. Collision check: ensure the slot isn't already taken
    const existingBooking = await Booking.findOne({
      creatorUsername: normalizedCreator,
      date: date.trim(),
      timeSlot: timeSlot.trim(),
      status: 'confirmed',
    }).lean();

    if (existingBooking) {
      return NextResponse.json({
        success: false,
        error: `The ${timeSlot} slot on ${date} is already booked. Please choose another time.`,
        slotTaken: true,
      }, { status: 409 });
    }

    // 4. Generate meeting URL (Google Meet / Zoom)
    const meetingUrl = generateMeetingLink(platform, clientName.trim(), normalizedCreator);

    // 5. Create and persist booking document
    const newBooking = await Booking.create({
      creatorUsername: normalizedCreator,
      clientName: clientName.trim(),
      clientEmail: normalizedEmail,
      clientPhone: clientPhone.trim(),
      topic: topic.trim() || 'General Consultation & Collaboration',
      date: date.trim(),
      timeSlot: timeSlot.trim(),
      durationMinutes: Number(durationMinutes) || 30,
      price: price || 'Free',
      meetingPlatform: platform || 'google_meet',
      meetingUrl,
      calendarEventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timezone: timezone || profile.scheduleMeeting?.timezone || 'UTC',
      status: 'confirmed',
    });

    return NextResponse.json({
      success: true,
      message: 'Meeting confirmed successfully!',
      booking: newBooking,
    }, { status: 201 });
  } catch (error) {
    console.error('API Bookings POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
