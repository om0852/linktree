import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/mongodb';
import ApiKey from '@/models/ApiKey';
import User from '@/models/User';
import { requireAuth } from '@/lib/authorization';

// GET /api/v1/api-keys - List API keys for caller
export async function GET(request) {
  try {
    await connectToDatabase();
    const access = await requireAuth(request);
    if (access.error) return access.error;
    const authUser = access.user;

    const { searchParams } = new URL(request.url);
    const targetUser = searchParams.get('username')?.toLowerCase()?.trim() || authUser.username;

    // Non-admins can only see their own keys
    if (authUser.role !== 'admin' && targetUser !== authUser.username) {
      return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
    }

    const query = authUser.role === 'admin' && !searchParams.get('username')
      ? {}
      : { username: targetUser };

    const keys = await ApiKey.find(query).sort({ createdAt: -1 }).lean();

    const formatted = keys.map((k) => ({
      id: k._id.toString(),
      name: k.name,
      keyPrefix: k.keyPrefix,
      fullKeyMasked: `${k.keyPrefix}...••••••••`,
      username: k.username,
      role: k.role,
      permissions: k.permissions || ['*'],
      lastUsed: k.lastUsed,
      createdAt: k.createdAt,
    }));

    return NextResponse.json({
      success: true,
      total: formatted.length,
      keys: formatted,
    });
  } catch (error) {
    console.error('API Keys GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/v1/api-keys - Generate a new API key
export async function POST(request) {
  try {
    await connectToDatabase();
    const access = await requireAuth(request);
    if (access.error) return access.error;
    const authUser = access.user;

    // A leaked key must not be able to mint more keys: managing keys needs a
    // signed-in session.
    if (access.session?.isApiKey) {
      return NextResponse.json({ success: false, error: 'API keys cannot create API keys. Sign in to manage keys.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, permissions, username: customUser } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Key name is required.' }, { status: 400 });
    }

    const targetUsername = (authUser.role === 'admin' && customUser)
      ? customUser.toLowerCase().trim()
      : authUser.username;

    let targetUserId = authUser._id;
    if (targetUsername !== authUser.username) {
      const foundUser = await User.findOne({ username: targetUsername }).select('_id').lean();
      if (foundUser) targetUserId = foundUser._id;
    }

    const secretRandom = crypto.randomBytes(24).toString('hex');
    const fullKey = `tree_live_${secretRandom}`;
    const keyPrefix = fullKey.substring(0, 16);
    const keyHash = crypto.createHash('sha256').update(fullKey).digest('hex');

    // 'read' = look only, 'write' = full access (legacy '*' means full).
    const allowed = ['read', 'write', '*'];
    const requested = Array.isArray(permissions) ? permissions.filter((perm) => allowed.includes(perm)) : [];
    const perms = requested.length ? [...new Set(requested)] : ['write'];

    const newKey = await ApiKey.create({
      name: name.trim(),
      keyPrefix,
      keyHash,
      userId: targetUserId,
      username: targetUsername,
      role: authUser.role === 'admin' ? 'admin' : 'creator',
      permissions: perms,
    });

    return NextResponse.json({
      success: true,
      message: 'API Key generated successfully. Save this secret key securely, it will not be shown again.',
      key: {
        id: newKey._id.toString(),
        name: newKey.name,
        keyPrefix: newKey.keyPrefix,
        username: newKey.username,
        role: newKey.role,
        permissions: newKey.permissions,
        createdAt: newKey.createdAt,
      },
      fullKey,
    }, { status: 201 });
  } catch (error) {
    console.error('API Keys POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/v1/api-keys - Revoke/Delete an API key
export async function DELETE(request) {
  try {
    await connectToDatabase();
    const access = await requireAuth(request);
    if (access.error) return access.error;
    const authUser = access.user;
    if (access.session?.isApiKey) {
      return NextResponse.json({ success: false, error: 'API keys cannot revoke API keys. Sign in to manage keys.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Key ID is required.' }, { status: 400 });
    }

    const key = await ApiKey.findById(id).lean();
    if (!key) {
      return NextResponse.json({ success: false, error: 'API Key not found.' }, { status: 404 });
    }

    if (authUser.role !== 'admin' && key.username !== authUser.username) {
      return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
    }

    await ApiKey.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'API Key revoked successfully.',
    });
  } catch (error) {
    console.error('API Keys DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
