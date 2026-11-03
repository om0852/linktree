import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Booking from '@/models/Booking';
import { consumeRateLimit } from '@/lib/rateLimit';

const ACTIVE_STATUSES = ['pending', 'confirmed', 'rescheduled'];

/**
 * Public slot availability for the booking calendar on a bio page.
 * Returns only the taken time slots for one creator and date, never who
 * booked them; the full list stays behind GET /api/bookings (owner only).
 */
export async function GET(req) {
  const rate = consumeRateLimit(req, 'booking-availability', 120, 15 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json({ success: false, error: 'Too many requests. Try again later.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } });
  }
  try {
    const { searchParams } = new URL(req.url);
    const creator = searchParams.get('creator')?.toLowerCase().trim();
    const date = searchParams.get('date')?.trim();
    if (!creator || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ success: false, error: 'creator and date (YYYY-MM-DD) are required.' }, { status: 400 });
    }

    await connectToDatabase();
    const taken = await Booking.find({ creatorUsername: creator, date, status: { $in: ACTIVE_STATUSES } })
      .select('timeSlot -_id')
      .lean();

    return NextResponse.json(
      { success: true, date, bookedSlots: taken.map((b) => b.timeSlot) },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error) {
    console.error('API Booking availability error:', error);
    return NextResponse.json({ success: false, error: 'Unable to load availability.' }, { status: 500 });
  }
}
