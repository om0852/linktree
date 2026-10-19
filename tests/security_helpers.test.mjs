import test from 'node:test';
import assert from 'node:assert/strict';
import { canAccessProfile } from '../src/lib/profileOwnership.js';
import { toOwnerProfile, toPublicProfile } from '../src/lib/publicProfile.js';

test('profile authorization allows only the primary profile, linked workspaces, or admins', async (t) => {
  const user = { username: 'creator', role: 'creator', profiles: ['profile-primary', 'profile-brand'] };

  await t.test('allows the primary profile case-insensitively', () => {
    assert.equal(canAccessProfile(user, 'CREATOR'), true);
  });

  await t.test('allows a profile ID linked to the user workspace', () => {
    assert.equal(canAccessProfile(user, 'brand-bio', 'profile-brand'), true);
  });

  await t.test('denies unrelated profiles and missing users', () => {
    assert.equal(canAccessProfile(user, 'someone-else', 'profile-other'), false);
    assert.equal(canAccessProfile(null, 'creator'), false);
  });

  await t.test('allows admins', () => {
    assert.equal(canAccessProfile({ role: 'admin' }, 'any-profile'), true);
  });
});

test('public profile serialization removes private keys recursively', () => {
  const profile = {
    username: 'creator',
    accessGate: { enabled: true, type: 'passcode', passcode: 'private-code' },
    integrations: [{ connectedAccountId: 'private-account', label: 'Mail' }],
    links: [{ title: 'Resource', leadMagnet: { marketingListId: 'private-list', enabled: true } }],
  };

  assert.deepEqual(toPublicProfile(profile), {
    username: 'creator',
    accessGate: { enabled: true, type: 'passcode' },
    integrations: [{ label: 'Mail' }],
    links: [{ title: 'Resource', leadMagnet: { enabled: true } }],
  });
});

test('owner profile serialization never returns the access passcode', () => {
  const result = toOwnerProfile({
    username: 'creator',
    accessGate: { enabled: true, type: 'passcode', passcode: 'private-code' },
  });

  assert.equal(result.accessGate.passcode, '');
});
