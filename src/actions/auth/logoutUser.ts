'use server'

import { removeSessionCookie } from '@/lib/auth'
import { redirect } from 'next/navigation'

export async function logoutUser() {
  try {
    await removeSessionCookie()
  } catch (err) {
    console.error('Gagal hapus cookie:', err)
  }

  redirect('/login')
}
