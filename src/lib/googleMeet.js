import { getComposioClient, isComposioConfigured } from './composio.js';

// Google Meet links for bookings: a Google Calendar event with a Meet room is
// created in the creator's connected Google account (via Composio), with the
// attendee invited. The Meet URL comes back on the event.

/** "9:30 AM" + "2026-11-11" → "2026-11-11T09:30:00" (local to the booking's timezone). */
export function toLocalDateTime(date, timeSlot) {
  const match = String(timeSlot || '').trim().match(/^(\d{1,2}):(\d{2})\s*([AP]M)?$/i);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || '')) || !match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59) return null;
  return `${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
}

/** First https://meet.google.com/... URL anywhere in a Composio response. */
export function findMeetUrl(value, depth = 0) {
  if (depth > 6 || value == null) return '';
  if (typeof value === 'string') return /^https:\/\/meet\.google\.com\/[a-z0-9-]+/i.test(value) ? value : '';
  if (typeof value !== 'object') return '';
  if (typeof value.hangoutLink === 'string' && value.hangoutLink) return findMeetUrl(value.hangoutLink, depth + 1);
  for (const child of Object.values(value)) {
    const found = findMeetUrl(child, depth + 1);
    if (found) return found;
  }
  return '';
}

function findEventId(value, depth = 0) {
  if (depth > 4 || !value || typeof value !== 'object') return '';
  if (typeof value.id === 'string' && (value.hangoutLink || value.htmlLink)) return value.id;
  for (const child of Object.values(value)) {
    const found = findEventId(child, depth + 1);
    if (found) return found;
  }
  return '';
}

const toolkitOf = (account) => String(
  account?.toolkit?.slug || account?.toolkit || account?.app?.slug || account?.appName || account?.toolkitSlug || ''
).toLowerCase();

/**
 * Create a Google Meet link for `booking` in the calendar of `creatorUsername`.
 * Returns { success, meetingUrl, eventId } or { success: false, status, error }.
 */
export async function createGoogleMeetForBooking(booking, { creatorUsername, timezone = 'UTC', title } = {}) {
  if (!isComposioConfigured()) {
    return { success: false, status: 'not_configured', error: 'Google integration is not set up on this server (COMPOSIO_API_KEY).' };
  }
  const start = toLocalDateTime(booking.date, booking.timeSlot);
  if (!start) return { success: false, status: 'invalid_booking', error: 'This booking has no valid date and time.' };

  const client = getComposioClient();
  const userId = String(creatorUsername || booking.creatorUsername || '').toLowerCase();

  let accounts = null;
  try {
    accounts = await client.connectedAccounts.list({ userIds: [userId] });
  } catch (error) {
    console.error('Google Meet: could not list connected accounts:', error.message);
  }
  const calendar = accounts?.items?.find((account) => {
    const status = String(account.status || '').toUpperCase();
    return toolkitOf(account).includes('googlecalendar') && (status === 'ACTIVE' || status === 'CONNECTED');
  });
  if (!calendar) {
    return { success: false, status: 'not_connected', error: 'Connect Google Calendar in Connectors to generate Google Meet links.' };
  }

  const minutes = Math.max(15, Number(booking.durationMinutes) || 30);
  const result = await client.tools.execute('GOOGLECALENDAR_CREATE_EVENT', {
    userId,
    arguments: {
      calendar_id: 'primary',
      summary: title || `${booking.topic || 'Meeting'} with ${booking.clientName}`,
      description: booking.topic ? `Booked on TreeInBio: ${booking.topic}` : 'Booked on TreeInBio',
      start_datetime: start,
      timezone: timezone || 'UTC',
      event_duration_hour: Math.floor(minutes / 60),
      event_duration_minutes: minutes % 60,
      attendees: booking.clientEmail ? [booking.clientEmail] : [],
      send_updates: 'all',
      create_meeting_room: true,
    },
  });

  if (!result || result.successful === false || result.error) {
    return { success: false, status: 'google_error', error: result?.error || 'Google Calendar did not create the event.' };
  }
  const meetingUrl = findMeetUrl(result.data);
  if (!meetingUrl) {
    return { success: false, status: 'no_meet_link', error: 'The calendar event was created, but Google returned no Meet link.' };
  }
  return { success: true, meetingUrl, eventId: findEventId(result.data) };
}
