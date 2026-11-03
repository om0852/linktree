import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toLocalDateTime, findMeetUrl } from '../src/lib/googleMeet.js';

describe('Google Meet links for bookings', () => {
  it('turns a booking date and slot into a local start time', () => {
    assert.equal(toLocalDateTime('2026-11-11', '9:30 AM'), '2026-11-11T09:30:00');
    assert.equal(toLocalDateTime('2026-11-11', '12:00 PM'), '2026-11-11T12:00:00');
    assert.equal(toLocalDateTime('2026-11-11', '12:15 AM'), '2026-11-11T00:15:00');
    assert.equal(toLocalDateTime('2026-11-11', '4:45 PM'), '2026-11-11T16:45:00');
    assert.equal(toLocalDateTime('2026-11-11', '14:00'), '2026-11-11T14:00:00');
    assert.equal(toLocalDateTime('11/11/2026', '9:30 AM'), null);
    assert.equal(toLocalDateTime('2026-11-11', 'soon'), null);
  });

  it('finds the Meet URL wherever Google puts it in the response', () => {
    assert.equal(findMeetUrl({ response_data: { hangoutLink: 'https://meet.google.com/abc-defg-hij' } }), 'https://meet.google.com/abc-defg-hij');
    assert.equal(
      findMeetUrl({ data: { conferenceData: { entryPoints: [{ entryPointType: 'video', uri: 'https://meet.google.com/xyz-abcd-efg' }] } } }),
      'https://meet.google.com/xyz-abcd-efg'
    );
    assert.equal(findMeetUrl({ htmlLink: 'https://www.google.com/calendar/event?eid=1' }), '');
  });
});
