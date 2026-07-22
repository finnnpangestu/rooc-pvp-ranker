'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { revalidatePath } from 'next/cache'

export async function deleteResource(resourceId: string) {
  try {
    const payload = await getPayload({ config: configPromise })

    await payload.delete({
      collection: 'resources',
      id: resourceId,
    })

    revalidatePath('/resources')
    revalidatePath('/')

    return { success: true }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}
