import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

function getJwtSecret(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.PAYLOAD_SECRET ||
    'rooc-pvp-ranker-jwt-secret-key-32-chars-minimum-fallback!'

  return new TextEncoder().encode(secret)
}

export const JWT_SECRET = getJwtSecret()

export const AUTH_COOKIE_NAME = 'session-token'

export interface SessionUser {
  id: string
  name: string | null
  email: string
  role: 'super_admin' | 'guild_master'
}

export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(plainText, salt)
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash)
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecret())
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    return {
      id: payload.id as string,
      name: (payload.name as string) || null,
      email: payload.email as string,
      role: (payload.role as 'super_admin' | 'guild_master') || 'guild_master',
    }
  } catch {
    return null
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  })
}

export async function removeSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_COOKIE_NAME)
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
  if (!token) return null
  return verifySessionToken(token)
}
