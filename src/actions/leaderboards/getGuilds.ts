'use server'

import { db } from '@/db'
import { guilds } from '@/db/schema'
import { desc, sql } from 'drizzle-orm'

export async function getGuilds() {
  try {
    const guildsRes = await db.query.guilds.findMany({
      orderBy: [desc(sql`CAST(${guilds.total_pvp_score} AS numeric)`)],
    })

    return guildsRes
  } catch (error) {
    console.error('Error fetching guilds:', error)
    return []
  }
}
