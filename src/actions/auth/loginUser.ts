'use server'

import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { verifyPassword, createSessionToken, setSessionCookie } from '@/lib/auth'
import { verifyTurnstileToken } from '@/lib/turnstile'

export async function loginUser(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const turnstileToken = formData.get('cf-turnstile-response') as string

  const isHuman = await verifyTurnstileToken(turnstileToken)
  if (!isHuman) {
    return { success: false, message: 'Bot security verification failed. Please complete the verification.' }
  }

  if (!email || !password) {
    return { success: false, message: 'Email and password are required' }
  }

  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase().trim()),
    })

    if (!existingUser) {
      return { success: false, message: 'Invalid email or password' }
    }

    const isValid = await verifyPassword(password, existingUser.password)
    if (!isValid) {
      return { success: false, message: 'Invalid email or password' }
    }

    const sessionUser = {
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role,
    }

    const token = await createSessionToken(sessionUser)
    await setSessionCookie(token)

    return { success: true, user: sessionUser }
  } catch (error: unknown) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Login failed',
      error: error instanceof Error ? error.message : 'Login failed',
    }
  }
}
