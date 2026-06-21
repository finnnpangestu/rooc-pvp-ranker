'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

export async function verifyCharacter(characterId: string | number) {
  try {
    const reqHeaders = await headers()
    const payload = await getPayload({ config })

    const { user } = await payload.auth({ headers: reqHeaders })

    if (!user) {
      return { success: false, message: 'Unauthorized' }
    }

    // Attempt to update the character
    // Payload's access control will block it if the user is not the guild master of this character's guild!
    await payload.update({
      collection: 'characters',
      id: characterId,
      data: {
        isVerified: true,
      },
      user: user,
    })

    return { success: true, message: 'Character verified successfully' }
  } catch (error: any) {
    console.error('Verify error:', error)
    return { success: false, message: error.message || 'Failed to verify character' }
  }
}
