'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function updateCharacterStats(id: string, payloadData: any, autoVerify: boolean = false) {
  try {
    const payload = await getPayload({ config: configPromise })

    const updatedDoc = await payload.update({
      collection: 'characters',
      id,
      data: {
        ...payloadData,
        isVerified: autoVerify,
      },
      overrideAccess: true,
    })

    return { success: true, doc: updatedDoc }
  } catch (error: any) {
    return { success: false, message: error.message || 'Gagal memperbarui karakter' }
  }
}
