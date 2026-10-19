import mongoose from 'mongoose';

const AnalyticsEventSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  event_type: {
    type: String,
    enum: ['profile_view', 'link_click', 'view', 'click'],
    required: true,
    index: true,
  },
  eventType: {
    type: String,
    enum: ['profile_view', 'link_click', 'view', 'click'],
    default: function() { return this.event_type; },
    index: true,
  },
  target_id: {
    type: String,
    required: true,
    index: true,
  },
  profileUsername: {
    type: String,
    required: true,
    index: true,
  },
  link_id: {
    type: String,
    default: null,
    index: true,
  },
  destination_url: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  ip_hash: {
    type: String,
    required: true,
    index: true,
  },
  country: {
    type: String,
    default: 'Global',
  },
  country_code: {
    type: String,
    default: 'GL',
    index: true,
  },
  region: {
    type: String,
    default: '',
  },
  city: {
    type: String,
    default: '',
  },
  device: {
    type: String,
    default: 'desktop',
  },
  os: {
    type: String,
    default: 'Other',
  },
  browser: {
    type: String,
    default: 'Other',
  },
  referrer: {
    type: String,
    default: 'Direct',
  },
  source: {
    type: String,
    default: 'Direct',
    index: true,
  },
  language: {
    type: String,
    default: 'en',
  },
  utm_source: {
    type: String,
    default: '',
  },
  utm_medium: {
    type: String,
    default: '',
  },
  utm_campaign: {
    type: String,
    default: '',
  },
  utm_term: {
    type: String,
    default: '',
  },
  utm_content: {
    type: String,
    default: '',
  },
  is_unique: {
    type: Boolean,
    default: true,
    index: true,
  },
  is_bot: {
    type: Boolean,
    default: false,
    index: true,
  },
  latency_ms: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

// Optimized compound indexes for sub-millisecond edge queries and uniqueness checks
AnalyticsEventSchema.index({ target_id: 1, timestamp: -1 });
AnalyticsEventSchema.index({ target_id: 1, ip_hash: 1 });
AnalyticsEventSchema.index({ profileUsername: 1, timestamp: -1 });
AnalyticsEventSchema.index({ profileUsername: 1, ip_hash: 1 });
AnalyticsEventSchema.index({ profileUsername: 1, event_type: 1, timestamp: -1 });
AnalyticsEventSchema.index({ timestamp: -1 });
AnalyticsEventSchema.index({ is_bot: 1, timestamp: -1 });

// Ensure hot reload picks up fresh schema definition in development
if (mongoose.models && mongoose.models.AnalyticsEvent) {
  delete mongoose.models.AnalyticsEvent;
}

export default mongoose.models.AnalyticsEvent || mongoose.model('AnalyticsEvent', AnalyticsEventSchema);
