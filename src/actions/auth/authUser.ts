'use server'

import { getSessionUser, type SessionUser } from '@/lib/auth'

export async function getAuthUser(): Promise<{ user: SessionUser | null; payload: unknown }> {
  const user = await getSessionUser()
  return { user, payload: null }
}
