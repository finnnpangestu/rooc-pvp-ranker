'use server'

import { cookies } from 'next/headers'

export async function logoutUser() {
  try {
    await fetch('/api/users/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    const cookieStore = await cookies()
    cookieStore.delete('payload-token')

    window.location.href = '/login'
  } catch (err) {
    console.error('Gagal logout:', err)
  }
}
