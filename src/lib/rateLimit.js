const buckets = new Map();

export function consumeRateLimit(request, scope, limit, windowMs) {
  if (process.env.NODE_ENV !== 'production') return { allowed: true };
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const clientIp = request.headers.get('x-real-ip') || forwarded || 'unknown';
  const key = `${scope}:${clientIp}`;
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) {
      for (const [bucketKey, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
    return { allowed: true };
  }
  current.count += 1;
  return current.count <= limit
    ? { allowed: true }
    : { allowed: false, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
}
