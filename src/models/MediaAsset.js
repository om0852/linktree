import mongoose from 'mongoose';

// An image uploaded from the Studio (today: wallpaper photos), stored in two
// sizes so phones download the small one. Served by /api/media/:id; an asset
// never changes, so a new upload always gets a new id.
const MediaAssetSchema = new mongoose.Schema({
  ownerId: { type: String, required: true, index: true },
  kind: { type: String, enum: ['wallpaper'], default: 'wallpaper' },
  mime: { type: String, enum: ['image/webp', 'image/jpeg', 'image/png'], required: true },
  width: { type: Number, default: 0 },
  height: { type: Number, default: 0 },
  small: { type: Buffer, required: true },
  large: { type: Buffer, required: true },
  meta: { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true });

MediaAssetSchema.index({ ownerId: 1, createdAt: -1 });

if (mongoose.models && mongoose.models.MediaAsset) {
  delete mongoose.models.MediaAsset;
}

export default mongoose.models.MediaAsset || mongoose.model('MediaAsset', MediaAssetSchema);
