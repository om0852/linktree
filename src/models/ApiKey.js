import mongoose from 'mongoose';

const ApiKeySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Key name is required'],
      trim: true,
      maxlength: 100,
    },
    keyPrefix: {
      type: String,
      required: true,
      index: true,
    },
    keyHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    username: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['creator', 'agency', 'admin'],
      default: 'creator',
    },
    permissions: {
      type: [String],
      default: ['*'],
    },
    lastUsed: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.ApiKey) {
  delete mongoose.models.ApiKey;
}

export default mongoose.models.ApiKey || mongoose.model('ApiKey', ApiKeySchema);
