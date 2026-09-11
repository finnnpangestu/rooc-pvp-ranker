'use server'

import { db } from '@/db'
import { characters } from '@/db/schema'
import { eq, desc, sql } from 'drizzle-orm'

export async function getCharacters() {
  try {
    const charsRes = await db.query.characters.findMany({
      where: eq(characters.isVerified, true),
      orderBy: [desc(sql`CAST(${characters.pvp_score} AS numeric)`)],
    })

    return charsRes
  } catch (error) {
    console.error('Error fetching characters:', error)
    return []
  }
}
