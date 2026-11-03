import connectToDatabase from '@/lib/mongodb';
import RateLimitCounter from '@/models/RateLimitCounter';

/**
 * Count one request for `subject` against every window in `limits`
 * ([{ windowMs, max }]). Returns { allowed, retryAfterSeconds }.
 */
export async function consumeSharedQuota(subject, limits) {
  await connectToDatabase();
  const now = Date.now();
  let retryAfterSeconds = 0;
  for (const { windowMs, max } of limits) {
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const counter = await RateLimitCounter.findOneAndUpdate(
      { key: `${subject}:${windowMs}:${windowStart}` },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(windowStart + windowMs + 60000) } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
    if (counter.count > max) {
      retryAfterSeconds = Math.max(retryAfterSeconds, Math.ceil((windowStart + windowMs - now) / 1000));
    }
  }
  return { allowed: retryAfterSeconds === 0, retryAfterSeconds };
}
