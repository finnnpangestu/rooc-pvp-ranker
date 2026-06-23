// src/app/(frontend)/dashboard/actions.ts
'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getAuthUser() {
  const reqHeaders = await headers()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: reqHeaders })
  return { user, payload }
}

export async function createGuild(name: string) {
  const { user, payload } = await getAuthUser()
  if (!user || user.role !== 'guild_master') {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    await payload.create({
      collection: 'guilds',
      data: {
        name,
        guild_master: user.id,
      },
      overrideAccess: true,
    })
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal membuat guild' }
  }
}

export async function deleteGuild(guildId: string) {
  const { user, payload } = await getAuthUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    const members = await payload.find({
      collection: 'characters',
      where: { guild_id: { equals: guildId } },
      limit: 1000,
      overrideAccess: true,
    })

    for (const member of members.docs) {
      await payload.update({
        collection: 'characters',
        id: member.id,
        data: {
          guild_id: null as any,
          isVerified: false,
        },
        overrideAccess: true,
      })
    }

    await payload.delete({
      collection: 'guilds',
      id: guildId,
      overrideAccess: true,
    })

    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal menghapus guild' }
  }
}

export async function toggleVerifyMember(characterId: string, currentStatus: boolean) {
  const { user, payload } = await getAuthUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    await payload.update({
      collection: 'characters',
      id: characterId,
      data: {
        isVerified: !currentStatus,
      },
      overrideAccess: true,
    })
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal mengubah status verifikasi' }
  }
}
