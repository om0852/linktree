import mongoose from 'mongoose';

const TipSchema = new mongoose.Schema({
  profileUsername: {
    type: String,
    required: true,
    index: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  senderName: {
    type: String,
    default: 'Generous Supporter',
  },
  message: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['completed', 'pending'],
    default: 'completed',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

TipSchema.index({ profileUsername: 1, timestamp: -1 });

export default mongoose.models.Tip || mongoose.model('Tip', TipSchema);
