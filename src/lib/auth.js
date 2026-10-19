import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, AUTH_TOKEN_EXPIRY_DAYS } from '@/constants/app';

const JWT_SECRET = process.env.JWT_SECRET || 'treeinbio_jwt_secret_production_key_2026_secured';

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
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: `${AUTH_TOKEN_EXPIRY_DAYS}d`,
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Extract authenticated user payload from request cookies or Authorization header
 */
export async function getAuthUser(request) {
  let token = null;

  // 1. Try Next.js server cookie store
  try {
    const cookieStore = await cookies();
    token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  } catch {
    // In environments where cookies() throws or isn't available
  }

  // 2. Try request.cookies if available
  if (!token && request?.cookies) {
    if (typeof request.cookies.get === 'function') {
      token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    } else {
      token = request.cookies[AUTH_COOKIE_NAME];
    }
  }

  // 3. Try Authorization: Bearer <token>
  if (!token && request?.headers) {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }

  if (!token) return null;

  return verifyToken(token);
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
