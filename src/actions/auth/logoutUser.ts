'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function logoutUser() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('payload-token')
  } catch (err) {
    console.error('Gagal hapus cookie:', err)
  }
  
  redirect('/login')
}
