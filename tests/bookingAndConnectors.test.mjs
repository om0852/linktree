import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'treeinbio_jwt_secret_production_key_2026_secured';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^(\+?[0-9\s\-().]{7,20})$/;

// Slot generation logic test
function generateSlots(startHourStr = '09:00', endHourStr = '17:00', intervalMins = 30) {
  const [startH, startM] = (startHourStr || '09:00').split(':').map(Number);
  const [endH, endM] = (endHourStr || '17:00').split(':').map(Number);

  let startMinutes = startH * 60 + (startM || 0);
  const endMinutes = endH * 60 + (endM || 0);
  const slots = [];

  while (startMinutes + intervalMins <= endMinutes) {
    const h = Math.floor(startMinutes / 60);
    const m = startMinutes % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const displayM = m.toString().padStart(2, '0');
    slots.push(`${displayH}:${displayM} ${ampm}`);
    startMinutes += intervalMins;
  }

  return slots;
}

describe('Meeting Scheduling & Booking Unit Suite', () => {
  describe('Time Slot Generation & Interval Math', () => {
    test('Generates correct count of 30-min slots between 09:00 and 17:00 (8 hours = 16 slots)', () => {
      const slots = generateSlots('09:00', '17:00', 30);
      assert.equal(slots.length, 16);
      assert.equal(slots[0], '9:00 AM');
      assert.equal(slots[slots.length - 1], '4:30 PM');
    });

    test('Generates correct 60-min slots between 10:00 and 14:00 (4 hours = 4 slots)', () => {
      const slots = generateSlots('10:00', '14:00', 60);
      assert.equal(slots.length, 4);
      assert.deepEqual(slots, ['10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM']);
    });

    test('Generates 15-min slots for quick chats', () => {
      const slots = generateSlots('14:00', '15:00', 15);
      assert.equal(slots.length, 4);
      assert.deepEqual(slots, ['2:00 PM', '2:15 PM', '2:30 PM', '2:45 PM']);
    });
  });

  describe('Attendee Contact Validation', () => {
    test('Validates client booking email address', () => {
      assert.equal(EMAIL_REGEX.test('director@casting-agency.com'), true);
      assert.equal(EMAIL_REGEX.test('invalid-email'), false);
    });

    test('Validates optional client phone format', () => {
      assert.equal(PHONE_REGEX.test('+1 (555) 392-1049'), true);
      assert.equal(PHONE_REGEX.test('123'), false);
    });
  });
});

describe('Bookings API & Double-Booking Prevention End-to-End Suite', () => {
  const futureYear = 2029 + Math.floor(Math.random() * 5);
  const futureMonth = Math.floor(Math.random() * 12);
  const futureDay = 1 + Math.floor(Math.random() * 20);
  const d = new Date(Date.UTC(futureYear, futureMonth, futureDay));
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) {
    d.setUTCDate(d.getUTCDate() + 1);
  }
  const testDate = d.toISOString().slice(0, 10);
  const availableSlots = generateSlots('10:00', '16:00', 30);
  const testSlot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
  let createdBookingId = null;

  test('POST /api/bookings - Rejects submission without creator username', async () => {
    const res = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: 'Jane Director',
        clientEmail: 'jane@hollywood.com',
        date: testDate,
        timeSlot: testSlot
      }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.error, /creator username/i);
  });

  test('POST /api/bookings - Rejects submission with invalid email', async () => {
    const res = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creatorUsername: 'emilyvance',
        clientName: 'Jane Director',
        clientEmail: 'not-valid-email',
        date: testDate,
        timeSlot: testSlot
      }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.error, /valid email/i);
  });

  test('POST /api/bookings - Rejects submission without date or time slot', async () => {
    const res = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creatorUsername: 'emilyvance',
        clientName: 'Jane Director',
        clientEmail: 'jane@hollywood.com',
      }),
    });
    assert.equal(res.status, 400);
  });

  test('POST /api/bookings - Successfully books free slot and generates Google Meet room', async () => {
    const res = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creatorUsername: 'emilyvance',
        clientName: 'Sarah Casting Director',
        clientEmail: 'sarah@paramount.com',
        clientPhone: '+1 (555) 902-1200',
        topic: 'HBO Series Season 2 Audition Reading',
        date: testDate,
        timeSlot: testSlot,
        durationMinutes: 30,
        price: 'Free',
        platform: 'google_meet'
      }),
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.booking);
    assert.equal(data.booking.clientName, 'Sarah Casting Director');
    assert.equal(data.booking.date, testDate);
    assert.equal(data.booking.timeSlot, testSlot);
    assert.match(data.booking.meetingUrl, /meet\.google\.com/);
    createdBookingId = data.booking._id;
  });

  test('POST /api/bookings - Rejects duplicate booking on the exact same date and slot (409 Conflict)', async () => {
    const res = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creatorUsername: 'emilyvance',
        clientName: 'Another Producer',
        clientEmail: 'producer@warner.com',
        date: testDate,
        timeSlot: testSlot,
      }),
    });

    assert.equal(res.status, 409);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.slotTaken, true);
    assert.match(data.error, /already booked/i);
  });

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${jwt.sign({ id: 'test_admin_id', username: 'emilyvance', role: 'admin' }, JWT_SECRET, { expiresIn: '7d' })}`,
  });

  test('GET /api/bookings - Retrieves creator bookings and includes booked slot', async () => {
    const res = await fetch(`${BASE_URL}/api/bookings?creator=emilyvance&date=${testDate}`, {
      headers: getAuthHeaders(),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.bookings.length >= 1);
    const found = data.bookings.some(b => b.timeSlot === testSlot);
    assert.equal(found, true);
  });

  test('DELETE /api/bookings/[id] - Cancels booking cleanly', async () => {
    if (!createdBookingId) return;

    const res = await fetch(`${BASE_URL}/api/bookings/${createdBookingId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.booking.status, 'cancelled');
  });
});
