import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
  slotKey: { type: String, default: undefined },
  creatorUsername: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  clientName: {
    type: String,
    required: true,
    trim: true,
  },
  publicSocialProof: { type: Boolean, default: false },
  clientEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true,
  },
  clientPhone: {
    type: String,
    trim: true,
    default: '',
  },
  topic: {
    type: String,
    trim: true,
    default: '',
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
    index: true,
  },
  timeSlot: {
    type: String, // e.g. "10:00 AM"
    required: true,
  },
  durationMinutes: {
    type: Number,
    default: 30,
  },
  price: {
    type: String,
    default: 'Free',
  },
  meetingPlatform: {
    type: String,
    enum: ['google_meet', 'zoom', 'phone', 'custom'],
    default: 'google_meet',
  },
  meetingUrl: {
    type: String,
    default: '',
  },
  calendarEventId: {
    type: String,
    default: '',
  },
  timezone: {
    type: String,
    default: 'UTC',
  },
  status: {
    type: String,
    enum: ['confirmed', 'pending', 'cancelled', 'rescheduled'],
    default: 'pending',
    index: true,
  },
  source: {
    type: String,
    default: 'bio_scheduler',
  },
}, { timestamps: true });

// Prevent double bookings on the exact same date, slot, and creator
BookingSchema.index(
  { creatorUsername: 1, date: 1, timeSlot: 1, status: 1 },
  { unique: false }
);
BookingSchema.index({ slotKey: 1 }, { unique: true, sparse: true });

if (process.env.NODE_ENV !== 'production' && mongoose.models?.Booking) {
  delete mongoose.models.Booking;
}

export default mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
