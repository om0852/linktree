import mongoose from 'mongoose';

// Fixed-window request counters shared by every server instance (in-memory
// counters reset per serverless instance). Documents delete themselves via
// the TTL index once their window is over.
const RateLimitCounterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
});

RateLimitCounterSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

if (mongoose.models && mongoose.models.RateLimitCounter) {
  delete mongoose.models.RateLimitCounter;
}

export default mongoose.models.RateLimitCounter || mongoose.model('RateLimitCounter', RateLimitCounterSchema);
