'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function clearParties(setupId: string, mode: 'all' | 'elite' | 'sub') {
  try {
    const payload = await getPayload({ config: configPromise })

    const updateData: any = {}
    if (mode === 'all') {
      updateData.elite_parties = []
      updateData.sub_parties = []
    } else if (mode === 'elite') {
      updateData.elite_parties = []
      updateData.sub_parties = []
    } else if (mode === 'sub') {
      updateData.sub_parties = []
    }

    const updatedDoc = await payload.update({
      collection: 'party_setups',
      id: setupId,
      data: updateData,
      depth: 1,
    })

    return { success: true, doc: updatedDoc }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}
