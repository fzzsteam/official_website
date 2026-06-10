import 'server-only';

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { getEnv } from '@/lib/config/env';

export const ADMIN_SESSION_COOKIE_NAME = 'fzzs_admin_session';
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function getSessionSecret() {
  return new TextEncoder().encode(getEnv().COOKIE_SECRET);
}

export async function createAdminSession(adminUserId: string) {
  const token = await new SignJWT({ scope: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(adminUserId)
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_MAX_AGE}s`)
    .sign(getSessionSecret());

  cookies().set(ADMIN_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
}

export function clearAdminSession() {
  cookies().set(ADMIN_SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export async function getAdminSessionUserId() {
  const token = cookies().get(ADMIN_SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    return payload.scope === 'admin' && typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}
