'use server'

import { db } from '@/db'
import { characters } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function getCharactersDashboard(guildId: string) {
  try {
    const result = await db.query.characters.findMany({
      where: eq(characters.guild_id, guildId),
      orderBy: [desc(characters.created_at)],
    })

    return result
  } catch (error) {
    console.error('Error fetching characters:', error)
    return []
  }
}
