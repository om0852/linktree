import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Profile from '@/models/Profile';
import { getAuthUser } from '@/lib/auth';
import { requireProfileOwner } from '@/lib/authorization';
import { consumeRateLimit } from '@/lib/rateLimit';

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

function bookingConflictResponse() {
  return NextResponse.json({ success: false, error: 'This slot is already booked. Please choose another time.', slotTaken: true }, { status: 409 });
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

    const access = await requireProfileOwner(req, creatorUsername);
    if (access.error) return access.error;

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
    const rate = consumeRateLimit(req, 'booking-request', 8, 60 * 60 * 1000);
    if (!rate.allowed) return NextResponse.json({ success: false, error: 'Too many booking requests. Try again later.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } });
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
    const meetingSettings = profile.scheduleMeeting || { enabled: true };
    if (meetingSettings.enabled === false) return NextResponse.json({ success: false, error: 'Bookings are not enabled for this creator.' }, { status: 409 });
    const selectedDate = new Date(`${date.trim()}T12:00:00Z`);
    const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim()) || Number.isNaN(selectedDate.getTime()) || selectedDate < today || selectedDate.toISOString().slice(0, 10) !== date.trim()) {
      return NextResponse.json({ success: false, error: 'Choose a valid upcoming date.' }, { status: 400 });
    }
    const requestedDuration = Number(durationMinutes);
    if (!Number.isFinite(requestedDuration) || requestedDuration < 15 || requestedDuration > 240 || (meetingSettings.durationMinutes && requestedDuration !== Number(meetingSettings.durationMinutes))) {
      return NextResponse.json({ success: false, error: 'Meeting duration must be between 15 and 240 minutes.' }, { status: 400 });
    }
    const allowedPlatform = meetingSettings.platform || 'google_meet';
    if (platform && platform !== allowedPlatform && allowedPlatform !== 'google_meet') return NextResponse.json({ success: false, error: 'The requested meeting platform is not configured.' }, { status: 400 });

    const scheduleTimezone = meetingSettings.timezone || 'UTC';
    const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: scheduleTimezone }).format(selectedDate);
    if (!(meetingSettings.availableDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']).includes(weekday)) {
      return NextResponse.json({ success: false, error: 'Bookings are not available on that day.' }, { status: 400 });
    }
    const toMinutes = (value, fallback) => {
      const [hour, minute] = String(value || fallback).split(':').map(Number);
      return Number.isInteger(hour) && Number.isInteger(minute) && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59
        ? hour * 60 + minute : null;
    };
    const startMinutes = toMinutes(meetingSettings.startHour, '09:00');
    const endMinutes = toMinutes(meetingSettings.endHour, '17:00');
    const interval = Number(meetingSettings.slotIntervalMinutes) || 30;
    const slotMatch = timeSlot.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!slotMatch || startMinutes === null || endMinutes === null || interval < 5 || interval > 240) {
      return NextResponse.json({ success: false, error: 'Invalid time slot.' }, { status: 400 });
    }
    let hour = Number(slotMatch[1]) % 12;
    if (slotMatch[3].toUpperCase() === 'PM') hour += 12;
    const slotMinutes = hour * 60 + Number(slotMatch[2]);
    if (slotMinutes < startMinutes || slotMinutes + requestedDuration > endMinutes || (slotMinutes - startMinutes) % interval !== 0) {
      return NextResponse.json({ success: false, error: 'That time is outside the creator’s available schedule.' }, { status: 400 });
    }

    // 3. Collision check: ensure the slot isn't already taken
    const slotKey = `${normalizedCreator}:${date.trim()}:${timeSlot.trim().toLowerCase()}`;
    const existingBooking = await Booking.findOne({
      creatorUsername: normalizedCreator,
      date: date.trim(),
      timeSlot: timeSlot.trim(),
      status: { $in: ['pending', 'confirmed', 'rescheduled'] },
    }).lean();

    if (existingBooking) {
      return bookingConflictResponse();
    }

    // 4. Generate meeting URL (Google Meet / Zoom)
    const meetingUrl = typeof meetingSettings.customLocationUrl === 'string' && /^https:\/\//i.test(meetingSettings.customLocationUrl.trim())
      ? meetingSettings.customLocationUrl.trim()
      : generateMeetingLink(allowedPlatform, clientName.trim(), normalizedCreator);

    // 5. Create and persist booking document
    const newBooking = await Booking.create({
      slotKey,
      creatorUsername: normalizedCreator,
      clientName: clientName.trim(),
      clientEmail: normalizedEmail,
      clientPhone: clientPhone.trim(),
      topic: topic.trim() || 'General Consultation & Collaboration',
      date: date.trim(),
      timeSlot: timeSlot.trim(),
      durationMinutes: requestedDuration,
      price: meetingSettings.price || 'Free',
      meetingPlatform: allowedPlatform,
      meetingUrl,
      calendarEventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timezone: meetingSettings.timezone || timezone || 'UTC',
      status: 'confirmed',
    });

    return NextResponse.json({
      success: true,
      message: 'Meeting confirmed successfully!',
      booking: newBooking,
    }, { status: 201 });
  } catch (error) {
    if (error?.code === 11000) return bookingConflictResponse();
    console.error('API Bookings POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
