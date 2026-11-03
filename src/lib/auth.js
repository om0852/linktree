import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, AUTH_TOKEN_EXPIRY_DAYS } from '@/constants/app';
import connectToDatabase from '@/lib/mongodb';
import ApiKey from '@/models/ApiKey';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  }
  return secret;
}

/**
 * Hash a plain text password with bcrypt
 */
export async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}

/**
 * Compare plain text password with stored bcrypt hash
 */
export async function verifyPassword(plainPassword, storedHash) {
  if (!plainPassword || !storedHash) return false;
  return bcrypt.compare(plainPassword, storedHash);
}

/**
 * Sign a signed JWT token
 */
export function signToken(payload) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: `${AUTH_TOKEN_EXPIRY_DAYS}d`,
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch {
    return null;
  }
}

/**
 * Extract authenticated user payload from request cookies, Authorization header, or API key
 */
export async function getAuthUser(request) {
  // 1. Check for API Key in x-api-key header or Bearer token
  if (request?.headers) {
    const rawApiKey = request.headers.get('x-api-key') || request.headers.get('X-API-Key');
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');

    let candidateKey = rawApiKey?.trim() || null;
    if (!candidateKey && authHeader && authHeader.startsWith('Bearer ')) {
      const bearerCandidate = authHeader.substring(7).trim();
      if (bearerCandidate.startsWith('tree_live_') || bearerCandidate.startsWith('sk_live_')) {
        candidateKey = bearerCandidate;
      }
    }

    if (candidateKey) {
      // A. Master Platform Key check via timingSafeEqual
      const masterKey = process.env.TREEINBIO_API_KEY || process.env.PLATFORM_API_KEY;
      if (masterKey) {
        const bufA = Buffer.from(candidateKey);
        const bufB = Buffer.from(masterKey);
        if (bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)) {
          const targetUser = request.headers.get('x-target-user') || request.headers.get('x-username') || 'admin';
          return {
            id: 'admin_master',
            userId: 'admin_master',
            _id: 'admin_master',
            username: targetUser,
            role: 'admin',
            isApiKey: true,
            isMasterKey: true,
          };
        }
      }

      // B. Scoped Database API Key check
      try {
        await connectToDatabase();
        const keyHash = crypto.createHash('sha256').update(candidateKey).digest('hex');
        const keyDoc = await ApiKey.findOne({ keyHash }).lean();
        if (keyDoc) {
          ApiKey.updateOne({ _id: keyDoc._id }, { $set: { lastUsed: new Date() } }).catch(() => {});
          const resolvedId = keyDoc.userId ? keyDoc.userId.toString() : `key_${keyDoc._id.toString()}`;
          return {
            id: resolvedId,
            userId: resolvedId,
            _id: resolvedId,
            username: keyDoc.username,
            role: keyDoc.role || 'creator',
            permissions: keyDoc.permissions || ['*'],
            isApiKey: true,
          };
        }
      } catch (err) {
        console.error('API key verification error:', err);
      }

      // If an explicit API key was provided but failed validation, reject immediately
      return null;
    }
  }

  let token = null;

  // 2. Try Next.js server cookie store
  try {
    const cookieStore = await cookies();
    token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  } catch {
    // In environments where cookies() throws or isn't available
  }

  // 3. Try request.cookies if available
  if (!token && request?.cookies) {
    if (typeof request.cookies.get === 'function') {
      token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    } else {
      token = request.cookies[AUTH_COOKIE_NAME];
    }
  }

  // 4. Try Authorization: Bearer <jwt_token>
  if (!token && request?.headers) {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }

  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  const userId = decoded.id || decoded.userId || decoded._id || decoded.sub;
  return {
    ...decoded,
    id: userId,
    userId: userId,
    _id: userId,
  };
}

/**
 * Set HTTP-Only authentication cookie on Next.js NextResponse
 */
export function setAuthCookie(response, token) {
  const maxAge = AUTH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60;
  const isProduction = process.env.NODE_ENV === 'production';

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge,
  });

  return response;
}

/**
 * Clear authentication cookie on Next.js NextResponse (Logout)
 */
export function clearAuthCookie(response) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
