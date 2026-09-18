'use server'

import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { hashPassword } from '@/lib/auth'
import { verifyTurnstileToken } from '@/lib/turnstile'

export async function registerUser(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string
  const turnstileToken = formData.get('cf-turnstile-response') as string

  const isHuman = await verifyTurnstileToken(turnstileToken)
  if (!isHuman) {
    return { success: false, error: 'Bot security verification failed. Please complete the verification.' }
  }

  if (!email || !password || !name) {
    return { success: false, error: 'All fields are required' }
  }

  try {
    const cleanEmail = email.toLowerCase().trim()

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, cleanEmail),
    })

    if (existingUser) {
      return { success: false, error: 'Email is already registered' }
    }

    const hashedPassword = await hashPassword(password)
    const newUserId = crypto.randomUUID()

    await db.insert(users).values({
      id: newUserId,
      email: cleanEmail,
      password: hashedPassword,
      name,
      role: 'guild_master',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    return { success: true }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Registration failed'
    return { success: false, error: errorMsg, message: errorMsg }
  }
}
