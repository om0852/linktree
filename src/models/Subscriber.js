import mongoose from 'mongoose';

const SubscriberSchema = new mongoose.Schema({
  profileUsername: {
    type: String,
    required: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true,
  },
  whatsApp: {
    type: String,
    trim: true,
    default: '',
  },
  name: {
    type: String,
    trim: true,
    default: '',
  },
  publicSocialProof: { type: Boolean, default: false },
  leadMagnetLinkId: {
    type: String,
    default: '',
  },
  assetTitle: {
    type: String,
    default: '',
  },
  unlockedAssets: [
    {
      linkId: { type: String, default: '' },
      assetTitle: { type: String, default: '' },
      unlockedAt: { type: Date, default: Date.now },
    }
  ],
  syncedTo: {
    type: [String],
    default: [],
  },
  syncStatus: {
    type: String,
    enum: ['synced', 'pending', 'failed', 'none'],
    default: 'none',
  },
  source: {
    type: String,
    default: 'lead_magnet',
  },
  subscribedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

SubscriberSchema.index({ profileUsername: 1, email: 1 });
SubscriberSchema.index({ profileUsername: 1, subscribedAt: -1 });

if (mongoose.models && mongoose.models.Subscriber) {
  delete mongoose.models.Subscriber;
}

export default mongoose.models.Subscriber || mongoose.model('Subscriber', SubscriberSchema);
