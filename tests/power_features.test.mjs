import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { detectEmbed } from '../src/utils/embedDetector.js';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

describe('TreeInBio Power Features Suite', () => {

  // 1. In-Page Media Embed Detector Unit Tests
  describe('In-Page Media Previews & Embed Detector', () => {
    test('Correctly detects Spotify track and extracts ID', () => {
      const url = 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT?si=abc123';
      const result = detectEmbed(url);
      assert.equal(result.isMedia, true);
      assert.equal(result.platform, 'spotify');
      assert.equal(result.embedId, '4cOdK2wGLETKBW3PvgPWqT');
      assert.match(result.embedUrl, /open\.spotify\.com\/embed\/track\/4cOdK2wGLETKBW3PvgPWqT/);
    });

    test('Correctly detects YouTube watch URL and extracts 11-char ID', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const result = detectEmbed(url);
      assert.equal(result.isMedia, true);
      assert.equal(result.platform, 'youtube');
      assert.equal(result.embedId, 'dQw4w9WgXcQ');
      assert.match(result.embedUrl, /youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);
    });

    test('Correctly detects YouTube short/shortened URL', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ';
      const result = detectEmbed(url);
      assert.equal(result.isMedia, true);
      assert.equal(result.platform, 'youtube');
      assert.equal(result.embedId, 'dQw4w9WgXcQ');
    });

    test('Correctly detects TikTok video URL and extracts ID', () => {
      const url = 'https://www.tiktok.com/@creator/video/7123456789012345678';
      const result = detectEmbed(url);
      assert.equal(result.isMedia, true);
      assert.equal(result.platform, 'tiktok');
      assert.equal(result.embedId, '7123456789012345678');
    });

    test('Correctly detects Apple Music song URL', () => {
      const url = 'https://music.apple.com/us/song/song-title/123456789';
      const result = detectEmbed(url);
      assert.equal(result.isMedia, true);
      assert.equal(result.platform, 'apple_music');
      assert.equal(result.embedId, '123456789');
    });

    test('Gracefully ignores non-media links', () => {
      const url = 'https://github.com/my-profile';
      const result = detectEmbed(url);
      assert.equal(result.isMedia, false);
      assert.equal(result.platform, 'none');
    });
  });

  // 2. Lead Magnet Lock-to-Unlock API Endpoint Tests
  describe('Lead Magnet Lock-to-Unlock API', () => {
    test('POST /api/v1/lead-magnet/unlock - Rejects request missing username', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/lead-magnet/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', linkId: 'link_1' }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.match(data.error, /Username is required/i);
    });

    test('POST /api/v1/lead-magnet/unlock - Rejects invalid email address', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/lead-magnet/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'omm', email: 'not-an-email', linkId: 'link_1' }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.match(data.error, /valid email address is required/i);
    });
  });

  // 3. Social Proof API Endpoint Tests
  describe('Social Proof Live Activity Ticker API', () => {
    test('GET /api/v1/social-proof/[username] - Returns verified events structure', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/social-proof/__missing_test_profile__`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.deepEqual(data.events, []);
      assert.ok(typeof data.intervalMs === 'number');
    });
  });

  // 4. Analytics Conversion Funnel Calculation Tests
  describe('Creator Conversion Funnel Analytics Pipeline', () => {
    test('GET /api/v1/analytics - Rejects unauthenticated analytics access', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/analytics?username=omm&range=30d`);
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.success, false);
    });
  });

  // 5. Multi-Profile Workspace Switcher API Tests
  describe('Multi-Profile Workspace Switcher API', () => {
    test('GET /api/profile/workspaces - Rejects unauthorized requests', async () => {
      const res = await fetch(`${BASE_URL}/api/profile/workspaces`);
      assert.equal(res.status, 401);
    });

    test('POST /api/profile/create-workspace - Rejects unauthorized creation', async () => {
      const res = await fetch(`${BASE_URL}/api/profile/create-workspace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testbrand' }),
      });
      assert.equal(res.status, 401);
    });

    test('POST /api/profile/access - Rejects malformed passcode payloads before database access', async () => {
      const res = await fetch(`${BASE_URL}/api/profile/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 12, passcode: '1234' }),
      });
      assert.equal(res.status, 400);
    });
  });
});
