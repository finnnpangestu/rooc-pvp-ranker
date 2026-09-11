import { db } from '@/db'
import { guilds } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function updateGuildTotals(guildId: string): Promise<void> {
  if (!guildId) return

  try {
    const verifiedChars = await db.query.characters.findMany({
      where: (chars, { eq: eqOp, and: andOp }) =>
        andOp(eqOp(chars.guild_id, guildId), eqOp(chars.isVerified, true)),
    })

    const totalScore = verifiedChars.reduce((sum, char) => sum + (Number(char.pvp_score) || 0), 0)

    await db
      .update(guilds)
      .set({
        total_characters: String(verifiedChars.length),
        total_pvp_score: String(totalScore),
        updated_at: new Date().toISOString(),
      })
      .where(eq(guilds.id, guildId))
  } catch (e) {
    console.error('Error updating guild totals:', e)
  }
}
