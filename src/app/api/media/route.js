import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import MediaAsset from '@/models/MediaAsset';
import Profile from '@/models/Profile';
import { requireAuth } from '@/lib/authorization';
import { consumeSharedQuota } from '@/lib/sharedRateLimit';
import { sanitizeImageMeta, sniffImageType } from '@/lib/wallpaperImage';

// The Studio resizes and compresses photos in the browser before uploading,
// so these limits are generous for real photos and tight for anything else.
const MAX_LARGE_BYTES = 2.5 * 1024 * 1024;
const MAX_SMALL_BYTES = 900 * 1024;
const MAX_ASSETS_PER_ACCOUNT = 30;

const fail = (error, status = 400) => NextResponse.json({ success: false, error }, { status });

async function readImage(file, maxBytes, label) {
  if (!file || typeof file.arrayBuffer !== 'function') throw new Error(`The ${label} image is missing.`);
  if (file.size > maxBytes) throw new Error(`The ${label} image is too large.`);
  const bytes = Buffer.from(await file.arrayBuffer());
  const mime = sniffImageType(bytes);
  if (!mime) throw new Error('Upload a JPEG, PNG or WebP photo.');
  return { bytes, mime };
}

// Keep each account under MAX_ASSETS_PER_ACCOUNT by removing its oldest
// uploads that no workspace of the account uses any more.
async function makeRoom(user) {
  const count = await MediaAsset.countDocuments({ ownerId: String(user._id) });
  if (count < MAX_ASSETS_PER_ACCOUNT) return true;
  const profileIds = (user.profiles || []).filter((id) => mongoose.isValidObjectId(id));
  const profiles = await Profile.find({ $or: [{ username: user.username }, { _id: { $in: profileIds } }] })
    .select('designSettings.wallpaper.imageUrl').lean();
  const inUse = new Set(profiles.map((p) => String(p.designSettings?.wallpaper?.imageUrl || '').split('/').pop()));
  const oldest = await MediaAsset.find({ ownerId: String(user._id) }).sort({ createdAt: 1 }).select('_id').lean();
  const removable = oldest.filter((asset) => !inUse.has(String(asset._id))).slice(0, count - MAX_ASSETS_PER_ACCOUNT + 1);
  if (count - removable.length >= MAX_ASSETS_PER_ACCOUNT) return false;
  await MediaAsset.deleteMany({ _id: { $in: removable.map((asset) => asset._id) } });
  return true;
}

// POST /api/media (multipart: large, small, meta) — upload a wallpaper photo.
// Signed-in owners only: API keys (and so AI assistants) cannot upload files.
export async function POST(request) {
  try {
    const access = await requireAuth(request);
    if (access.error) return access.error;
    if (access.session?.isApiKey) return fail('Sign in to the Studio to upload photos.', 403);
    const { user } = access;

    const quota = await consumeSharedQuota(`media-upload:${user._id}`, [{ windowMs: 60 * 60 * 1000, max: 40 }]);
    if (!quota.allowed) {
      return NextResponse.json({ success: false, error: 'Too many uploads. Try again later.' }, { status: 429, headers: { 'Retry-After': String(quota.retryAfterSeconds) } });
    }

    let form;
    try {
      form = await request.formData();
    } catch {
      return fail('Send the photo as a form upload.');
    }
    let large;
    let small;
    try {
      large = await readImage(form.get('large'), MAX_LARGE_BYTES, 'full-size');
      small = await readImage(form.get('small'), MAX_SMALL_BYTES, 'small');
    } catch (error) {
      return fail(error.message);
    }
    if (large.mime !== small.mime) return fail('Both sizes must be the same image type.');

    let meta = null;
    try {
      meta = sanitizeImageMeta(JSON.parse(String(form.get('meta') || 'null')));
    } catch {
      meta = null;
    }

    if (!(await makeRoom(user))) return fail('You have too many photos uploaded. Remove a wallpaper from a workspace first.', 409);

    const asset = await MediaAsset.create({
      ownerId: String(user._id),
      kind: 'wallpaper',
      mime: large.mime,
      width: meta?.width || 0,
      height: meta?.height || 0,
      small: small.bytes,
      large: large.bytes,
      meta,
    });
    return NextResponse.json({ success: true, url: `/api/media/${asset._id}`, meta }, { status: 201 });
  } catch (error) {
    console.error('Media upload failed:', error);
    return fail('Upload failed. Please try again.', 500);
  }
}
