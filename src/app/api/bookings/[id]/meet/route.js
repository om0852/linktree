import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Profile from '@/models/Profile';
import { requireProfileOwner } from '@/lib/authorization';
import { createGoogleMeetForBooking } from '@/lib/googleMeet';

// POST /api/bookings/:id/meet — create a Google Meet link for the booking in
// the creator's connected Google Calendar and save it on the booking.
export async function POST(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const booking = await Booking.findById(id);
    if (!booking) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });

    const access = await requireProfileOwner(req, booking.creatorUsername);
    if (access.error) return access.error;

    // One event per booking: reuse the link that was already generated.
    if (booking.calendarEventId && /^https:\/\/meet\.google\.com\//i.test(booking.meetingUrl || '')) {
      return NextResponse.json({ success: true, booking, reused: true });
    }

    const profile = await Profile.findOne({ username: booking.creatorUsername }).select('scheduleMeeting.timezone name').lean();
    const result = await createGoogleMeetForBooking(booking, {
      creatorUsername: booking.creatorUsername,
      timezone: booking.timezone && booking.timezone !== 'UTC' ? booking.timezone : profile?.scheduleMeeting?.timezone || 'UTC',
    });
    if (!result.success) {
      const status = result.status === 'not_connected' || result.status === 'not_configured' ? 409 : 502;
      return NextResponse.json({ success: false, code: result.status, error: result.error }, { status });
    }

    booking.meetingUrl = result.meetingUrl;
    booking.meetingPlatform = 'google_meet';
    if (result.eventId) booking.calendarEventId = result.eventId;
    await booking.save();
    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error('Google Meet generation failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Could not create the Google Meet link.' }, { status: 500 });
  }
}
