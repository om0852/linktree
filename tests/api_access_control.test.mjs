import test from 'node:test';
import assert from 'node:assert/strict';

const baseUrl = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

const protectedRequests = [
  ['GET', '/api/profile/workspaces'],
  ['POST', '/api/profile/create-workspace', { username: 'unauthorized-brand' }],
  ['POST', '/api/profile/switch', { username: 'another-profile' }],
  ['POST', '/api/profile', { username: '__access_test__' }],
  ['GET', '/api/bookings?creator=__access_test__'],
  ['GET', '/api/leads?username=__access_test__'],
  ['GET', '/api/leads/export?username=__access_test__'],
  ['GET', '/api/v1/domains'],
  ['POST', '/api/v1/domains', { hostname: 'bio.example.test' }],
  ['DELETE', '/api/v1/domains?id=000000000000000000000001'],
  ['GET', '/api/connectors/accounts'],
  ['POST', '/api/connectors/connect', { toolkitSlug: 'google' }],
  ['POST', '/api/connectors/execute', { toolSlug: 'SOME_TOOL' }],
  ['GET', '/api/integrations/accounts'],
  ['POST', '/api/integrations/connect', { toolkitSlug: 'google' }],
  ['POST', '/api/integrations/execute', { toolSlug: 'SOME_TOOL' }],
  ['GET', '/api/integrations/config'],
  ['POST', '/api/integrations/config', { apiKey: 'must-not-be-used' }],
  ['GET', '/api/v1/analytics?username=__access_test__'],
  ['GET', '/api/v1/analytics/export?username=__access_test__'],
  ['POST', '/api/v1/domains/verify', { hostname: 'bio.example.test' }],
  ['PATCH', '/api/media-kit/__access_test__', { enabled: true }],
];

test('protected API routes reject requests without an authenticated session', async (t) => {
  for (const [method, path, body] of protectedRequests) {
    await t.test(`${method} ${path}`, async () => {
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      assert.equal(response.status, 401);
      const payload = await response.json();
      assert.equal(payload.success, false);
    });
  }
});

test('GET /api/auth/me returns an unauthenticated session without exposing user data', async () => {
  const response = await fetch(`${baseUrl}/api/auth/me`);
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.authenticated, false);
  assert.equal(payload.user, null);
  assert.equal(payload.profile, null);
});

test('POST /api/auth/logout clears the authentication cookie', async () => {
  const response = await fetch(`${baseUrl}/api/auth/logout`, { method: 'POST' });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('set-cookie') || '', /Max-Age=0/i);
});

test('POST /api/auth/register rejects weak credentials', async (t) => {
  await t.test('rejects malformed email addresses', async () => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', username: 'valid_user', password: 'a-long-enough-password' }),
    });
    assert.equal(response.status, 400);
  });

  await t.test('rejects passwords shorter than the minimum length', async () => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'new-user@example.test', username: 'valid_user', password: 'short' }),
    });
    assert.equal(response.status, 400);
  });
});

test('POST /api/auth/login rejects an unknown account without setting a session', async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrUsername: '__unknown_api_test_account__', password: 'not-a-real-password' }),
  });
  assert.equal(response.status, 401);
  assert.equal(response.headers.get('set-cookie'), null);
});

test('POST /api/profile/access uses the same denial response for an unknown profile and a bad passcode', async () => {
  const response = await fetch(`${baseUrl}/api/profile/access`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: '__unknown_access_test_profile__', passcode: 'incorrect-code' }),
  });
  assert.equal(response.status, 403);
  const payload = await response.json();
  assert.equal(payload.error, 'Incorrect passcode.');
});
