/**
 * Decide whether an authenticated user can access a profile, including one
 * of the user's linked workspace profiles.
 */
export function canAccessProfile(user, username, profileId = null) {
  if (!user) return false;
  const normalized = String(username || '').toLowerCase().trim();
  if (user.role === 'admin' || String(user.username || '').toLowerCase() === normalized) return true;
  if (profileId == null) return false;
  return (user.profiles || []).some((id) => String(id) === String(profileId));
}
