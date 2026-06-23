'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { cookies } from 'next/headers'

export async function loginUser(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { success: false, message: 'Email dan password wajib diisi' }
  }

  try {
    const payload = await getPayload({ config })

    const result = await payload.login({
      collection: 'users',
      data: {
        email,
        password,
      },
    })

    if (result.token) {
      const cookieStore = await cookies()

      cookieStore.set({
        name: 'payload-token',
        value: result.token,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      })
    }

    return { success: true, user: result.user }
  } catch (error: any) {
    return { success: false, message: error.message || 'Login failed' }
  }
}
