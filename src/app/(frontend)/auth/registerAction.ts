'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function registerUser(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  if (!email || !password || !name) {
    return { success: false, error: 'Semua field wajib diisi' }
  }

  try {
    const payload = await getPayload({ config: configPromise })

    const existingUsers = await payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      overrideAccess: true,
    })

    if (existingUsers.totalDocs > 0) {
      return { success: false, error: 'Email sudah digunakan' }
    }

    await payload.create({
      collection: 'users',
      data: {
        email,
        password,
        name,
        role: 'guild_master',
      },
      overrideAccess: true,
    })

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal mendaftar' }
  }
}
