const PRIVATE_PROFILE_KEYS = new Set([
  'passcode', 'marketingListId', 'mailchimpAudienceId', 'convertkitFormId',
  'brevoListId', 'integrationAccountId', 'connectedAccountId',
  'customLocationUrl', 'apiKey', 'secret', 'passwordHash',
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

export function toPublicProfile(profile) {
  if (!profile) return null;
  const plain = typeof profile.toObject === 'function' ? profile.toObject() : profile;
  return stripPrivateFields(plain);
}

export function toOwnerProfile(profile) {
  if (!profile) return null;
  const plain = typeof profile.toObject === 'function' ? profile.toObject() : { ...profile };
  if (plain.accessGate) plain.accessGate = { ...plain.accessGate, passcode: '' };
  return plain;
}
