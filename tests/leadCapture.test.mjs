import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// Regex patterns used by the application
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^(\+?[0-9\s\-().]{7,20})$/;

describe('Lead Capture Form Validation Suite', () => {
  describe('Phone Number Format Validation', () => {
    const validPhones = [
      '+1 (555) 123-4567',
      '+91 98765 43210',
      '9876543210',
      '+44 20 7946 0919',
      '(800) 555-0199',
      '+1-202-555-0173',
      '555.123.4567',
    ];

    validPhones.forEach((phone) => {
      test(`Accepts valid phone format: "${phone}"`, () => {
        assert.equal(PHONE_REGEX.test(phone), true);
      });
    });

    const invalidPhones = [
      '12345',               // too short (<7 chars)
      'phone_number',         // letters
      '+1 555 ABCD',          // contains letters
      '+1-555-9999-0000-1111-2222', // too long (>20 chars)
      '@5551234567',         // invalid special char
      '',                    // empty string
    ];

    invalidPhones.forEach((phone) => {
      test(`Rejects invalid phone format: "${phone}"`, () => {
        assert.equal(PHONE_REGEX.test(phone), false);
      });
    });
  });

  describe('Email Format Validation', () => {
    const validEmails = [
      'creator@treeinbio.com',
      'john.doe+work@gmail.com',
      'contact@agency-studio.co.uk',
      'first_last123@sub.domain.org',
    ];

    validEmails.forEach((email) => {
      test(`Accepts valid email: "${email}"`, () => {
        assert.equal(EMAIL_REGEX.test(email), true);
      });
    });

    const invalidEmails = [
      'not-an-email',
      'missing-at-sign.com',
      'user@',
      '@domain.com',
      'user name@domain.com',
      'user@domain..com',
    ];

    invalidEmails.forEach((email) => {
      test(`Rejects invalid email: "${email}"`, () => {
        assert.equal(EMAIL_REGEX.test(email), false);
      });
    });
  });
});

describe('Lead Capture Platform API End-to-End Suite', () => {
  const testUsername = 'emilyvance'; // Preset creator present in system
  let createdLeadId = null;

  test('POST /api/leads - Rejects payload without creator username', async () => {
    const res = await fetch(`${BASE_URL}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Jane Doe',
        phone: '+1 555-0199',
        email: 'jane@example.com',
      }),
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.error, /Creator username is required/i);
  });

  test('POST /api/leads - Rejects non-existent creator username', async () => {
    const res = await fetch(`${BASE_URL}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creatorUsername: 'non_existent_creator_99999999',
        fullName: 'Jane Doe',
        phone: '+1 555-0199',
        email: 'jane@example.com',
      }),
    });

    assert.equal(res.status, 404);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.error, /does not exist/i);
  });

  test('POST /api/leads - Rejects submission with invalid phone number', async () => {
    const res = await fetch(`${BASE_URL}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creatorUsername: testUsername,
        fullName: 'Jane Doe',
        phone: '1234', // invalid short phone
        email: 'jane@example.com',
      }),
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.error, /phone number/i);
    assert.ok(data.validationErrors?.phone);
  });

  test('POST /api/leads - Rejects submission with invalid email', async () => {
    const res = await fetch(`${BASE_URL}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creatorUsername: testUsername,
        fullName: 'Jane Doe',
        phone: '+1 555-0199',
        email: 'not-a-valid-email',
      }),
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.error, /email address/i);
    assert.ok(data.validationErrors?.email);
  });

  test('POST /api/leads - Rejects submission with empty name if required', async () => {
    const res = await fetch(`${BASE_URL}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creatorUsername: testUsername,
        fullName: ' ',
        phone: '+1 555-0199',
        email: 'jane@example.com',
      }),
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.error, /full name/i);
  });

  test('POST /api/leads - Successfully persists valid lead with phone and email', async () => {
    const testPhone = '+1 (555) 234-5678';
    const testEmail = `visitor_${Date.now()}@producer.com`;
    const testName = 'Sarah Connor';

    const res = await fetch(`${BASE_URL}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creatorUsername: testUsername,
        fullName: testName,
        phone: testPhone,
        isWhatsApp: true,
        email: testEmail,
        company: 'Cyberdyne Media',
        note: 'Interested in booking you for our upcoming feature film project.',
        source: 'bio_form_dialog_test',
      }),
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.lead);
    assert.equal(data.lead.creatorUsername, testUsername);
    assert.equal(data.lead.fullName, testName);
    assert.equal(data.lead.phone, testPhone);
    assert.equal(data.lead.isWhatsApp, true);
    assert.equal(data.lead.email, testEmail);
    assert.equal(data.lead.company, 'Cyberdyne Media');
    assert.ok(['synced', 'pending', 'not_configured', 'failed'].includes(data.lead.syncStatus));

    createdLeadId = data.lead._id;
  });

  test('GET /api/leads - Retrieves captured leads and metrics for creator', async () => {
    assert.ok(createdLeadId, 'Previous test must have created a lead');

    const res = await fetch(`${BASE_URL}/api/leads?username=${testUsername}`);
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.leads));
    assert.ok(data.leads.length >= 1);

    // Verify metrics
    assert.ok(data.stats);
    assert.ok(typeof data.stats.total === 'number' && data.stats.total >= 1);
    assert.ok(typeof data.stats.withPhone === 'number' && data.stats.withPhone >= 1);

    // Verify created lead is in list
    const found = data.leads.find((l) => l._id === createdLeadId);
    assert.ok(found, 'Created lead must be present in GET leads list');
    assert.equal(found.fullName, 'Sarah Connor');
    assert.equal(found.phone, '+1 (555) 234-5678');
    assert.equal(found.isWhatsApp, true);
  });

  test('GET /api/leads - Filters leads by search query', async () => {
    const res = await fetch(`${BASE_URL}/api/leads?username=${testUsername}&q=Cyberdyne`);
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.leads.length >= 1);
    assert.equal(data.leads[0].company, 'Cyberdyne Media');
  });

  test('GET /api/leads/export - Generates downloadable RFC 4180 CSV export', async () => {
    const res = await fetch(`${BASE_URL}/api/leads/export?username=${testUsername}`);
    assert.equal(res.status, 200);

    const contentType = res.headers.get('content-type');
    assert.ok(contentType?.includes('text/csv'));

    const disposition = res.headers.get('content-disposition');
    assert.ok(disposition?.includes('attachment'));
    assert.ok(disposition?.includes(`.csv`));

    const csvText = await res.text();
    assert.ok(csvText.includes('Full Name,Phone Number,Email Address,Company / Brand,Message / Note,Google Contacts Synced,Sync Status,Date Captured'));
    assert.ok(csvText.includes('Sarah Connor'));
    assert.ok(csvText.includes('+1 (555) 234-5678'));
  });

  test('POST /api/leads/sync - Manual/retry Google Contacts sync endpoint responds cleanly', async () => {
    assert.ok(createdLeadId);

    const res = await fetch(`${BASE_URL}/api/leads/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: createdLeadId,
        username: testUsername,
      }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.lead);
    assert.ok(['synced', 'not_configured', 'failed', 'pending'].includes(data.syncResult?.status));
  });

  test('DELETE /api/leads - Deletes test lead cleanly from database', async () => {
    assert.ok(createdLeadId);

    const res = await fetch(`${BASE_URL}/api/leads?id=${createdLeadId}&username=${testUsername}`, {
      method: 'DELETE',
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);

    // Verify lead is gone
    const verifyRes = await fetch(`${BASE_URL}/api/leads?username=${testUsername}`);
    const verifyData = await verifyRes.json();
    const stillExists = verifyData.leads.some((l) => l._id === createdLeadId);
    assert.equal(stillExists, false, 'Deleted lead should no longer exist in database');
  });
});
