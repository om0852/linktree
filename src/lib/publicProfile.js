const PRIVATE_PROFILE_KEYS = new Set([
  'passcode', 'marketingListId', 'mailchimpAudienceId', 'convertkitFormId',
  'brevoListId', 'integrationAccountId', 'connectedAccountId',
  'customLocationUrl', 'apiKey', 'secret', 'passwordHash', 'assetUrl',
]);

function stripPrivateFields(value) {
  if (Array.isArray(value)) return value.map(stripPrivateFields);
  if (!value || typeof value !== 'object') return value;
  const result = {};
  for (const [key, child] of Object.entries(value)) {
    if (PRIVATE_PROFILE_KEYS.has(key)) continue;
    result[key] = stripPrivateFields(child);
  }
  return result;
}

// A lead magnet's destination is only released by the unlock endpoint after
// the visitor submits their details.
function hideLeadMagnetDestination(link) {
  return link?.leadMagnet?.enabled ? { ...link, url: '' } : link;
}

export function toPublicProfile(profile) {
  if (!profile) return null;
  const plain = typeof profile.toObject === 'function' ? profile.toObject() : profile;
  const result = stripPrivateFields(plain);
  if (Array.isArray(result.links)) result.links = result.links.map(hideLeadMagnetDestination);
  return result;
}

export function isPasscodeGated(profile) {
  return Boolean(profile?.accessGate?.enabled && profile.accessGate.type === 'passcode');
}

/**
 * Profile as an anonymous visitor may see it. Passcode-gated content is only
 * returned by the passcode check in /api/profile/access.
 */
export function toVisitorProfile(profile) {
  const result = toPublicProfile(profile);
  if (!result || !isPasscodeGated(profile)) return result;
  return {
    ...result,
    bio: '',
    avatar: '',
    coverImage: '',
    heroVideo: '',
    socials: {},
    links: [],
    collections: [],
    widgets: {
      hasNewsletter: false,
      hasTipJar: false,
      mediaKitStats: { followers: '0', engagement: '0%', monthlyViews: '0' },
    },
    storyBubble: { enabled: false, videoUrl: '', caption: '' },
    shop: { enabled: false, products: [] },
    leadCapture: { enabled: false },
    scheduleMeeting: { enabled: false },
    designSettings: { ...result.designSettings, stickers: [] },
  };
}

export function toOwnerProfile(profile) {
  if (!profile) return null;
  const plain = typeof profile.toObject === 'function' ? profile.toObject() : { ...profile };
  if (plain.accessGate) plain.accessGate = { ...plain.accessGate, passcode: '' };
  return plain;
}
