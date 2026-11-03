import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import MediaAsset from '@/models/MediaAsset';

// GET /api/media/:id[?size=small] — a public page's uploaded photo. Assets
// never change, so browsers and the CDN may keep them for a year.
export async function GET(request, { params }) {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return new Response('Not found', { status: 404 });
  const size = new URL(request.url).searchParams.get('size') === 'small' ? 'small' : 'large';
  await connectToDatabase();
  const asset = await MediaAsset.findById(id).select(`mime ${size}`).lean();
  if (!asset?.[size]) return new Response('Not found', { status: 404 });
  const bytes = asset[size].buffer ? Buffer.from(asset[size].buffer) : Buffer.from(asset[size]);
  return new Response(bytes, {
    headers: {
      'Content-Type': asset.mime,
      'Content-Length': String(bytes.length),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },
  });
}
