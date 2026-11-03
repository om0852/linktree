import test from 'node:test';
import assert from 'node:assert/strict';
import { canAccessProfile } from '../src/lib/profileOwnership.js';
import { toOwnerProfile, toPublicProfile, toVisitorProfile } from '../src/lib/publicProfile.js';
import { safeLinkUrl, safeMediaUrl } from '../src/lib/safeUrl.js';

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
    links: [{ title: 'Resource', url: '', leadMagnet: { enabled: true } }],
  });
});

test('owner profile serialization never returns the access passcode', () => {
  const result = toOwnerProfile({
    username: 'creator',
    accessGate: { enabled: true, type: 'passcode', passcode: 'private-code' },
  });

  assert.equal(result.accessGate.passcode, '');
});

test('public profile hides lead magnet destinations until unlocked', () => {
  const result = toPublicProfile({
    links: [
      { id: 'gated', url: 'https://files.example.com/guide.pdf', leadMagnet: { enabled: true, assetUrl: 'https://files.example.com/asset.pdf' } },
      { id: 'open', url: 'https://example.com', leadMagnet: { enabled: false, assetUrl: '' } },
    ],
  });

  assert.equal(result.links[0].url, '');
  assert.equal('assetUrl' in result.links[0].leadMagnet, false);
  assert.equal(result.links[1].url, 'https://example.com');
});

test('visitor profile withholds passcode-gated content', () => {
  const profile = {
    username: 'creator',
    bio: 'secret bio',
    links: [{ id: 'l1', url: 'https://example.com' }],
    accessGate: { enabled: true, type: 'passcode', passcode: 'hash' },
    designSettings: { stickers: [{ id: 's1' }], buttonStyle: 'solid' },
  };

  const gated = toVisitorProfile(profile);
  assert.equal(gated.bio, '');
  assert.deepEqual(gated.links, []);
  assert.deepEqual(gated.designSettings, { stickers: [], buttonStyle: 'solid' });
  assert.equal(gated.accessGate.passcode, undefined);

  const open = toVisitorProfile({ ...profile, accessGate: { enabled: false, type: 'none' } });
  assert.equal(open.bio, 'secret bio');
  assert.equal(open.links.length, 1);
});

test('link and media URLs reject script and unknown schemes', () => {
  assert.equal(safeLinkUrl('javascript:alert(1)'), '#');
  assert.equal(safeLinkUrl(' JavaScript:alert(1)'), '#');
  assert.equal(safeLinkUrl('data:text/html,<script>alert(1)</script>'), '#');
  assert.equal(safeLinkUrl('https://example.com/a'), 'https://example.com/a');
  assert.equal(safeLinkUrl('example.com/a'), 'https://example.com/a');
  assert.equal(safeLinkUrl('mailto:me@example.com'), 'mailto:me@example.com');
  assert.equal(safeLinkUrl('/shop'), '/shop');
  assert.equal(safeLinkUrl('//example.com/x'), 'https://example.com/x');
  assert.equal(safeLinkUrl(undefined), '#');

  assert.equal(safeMediaUrl('javascript:alert(1)'), '');
  assert.equal(safeMediaUrl('https://cdn.example.com/a.png'), 'https://cdn.example.com/a.png');
  assert.equal(safeMediaUrl('data:image/png;base64,AAAA'), '');
  assert.equal(safeMediaUrl('data:image/png;base64,AAAA', { allowDataImage: true }), 'data:image/png;base64,AAAA');
  assert.equal(safeMediaUrl('data:image/svg+xml;base64,AAAA', { allowDataImage: true }), '');
});
