import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Booking from '@/models/Booking';
import { requireProfileOwner } from '@/lib/authorization';

export async function DELETE(req, { params }) {
  try {
    await connectToDatabase();
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Booking ID is required' }, { status: 400 });
    }

    const existing = await Booking.findById(id).select('creatorUsername').lean();
    if (!existing) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    const access = await requireProfileOwner(req, existing.creatorUsername);
    if (access.error) return access.error;
    const booking = await Booking.findByIdAndUpdate(id, { $set: { status: 'cancelled' }, $unset: { slotKey: 1 } }, { new: true });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Booking successfully cancelled.',
      booking,
    });
  } catch (error) {
    console.error('API Booking DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    await connectToDatabase();
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'Booking ID is required' }, { status: 400 });
    }

    const existing = await Booking.findById(id).select('creatorUsername').lean();
    if (!existing) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    const access = await requireProfileOwner(req, existing.creatorUsername);
    if (access.error) return access.error;
    const allowedFields = ['status', 'topic', 'meetingUrl'];
    const update = Object.fromEntries(Object.entries(body).filter(([key]) => allowedFields.includes(key)));
    if (update.meetingUrl && !/^https:\/\//i.test(update.meetingUrl)) {
      return NextResponse.json({ success: false, error: 'Meeting URL must use HTTPS.' }, { status: 400 });
    }
    if (!Object.keys(update).length) return NextResponse.json({ success: false, error: 'No editable booking fields provided.' }, { status: 400 });
    const updateOperation = { $set: update };
    if (update.status === 'cancelled') updateOperation.$unset = { slotKey: 1 };
    const booking = await Booking.findByIdAndUpdate(id, updateOperation, { new: true, runValidators: true });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Booking updated successfully.',
      booking,
    });
  } catch (error) {
    console.error('API Booking PATCH error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
