'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { revalidatePath } from 'next/cache'

export async function saveReportGL(
  guildId: string,
  setupId: string,
  reportData: any,
  updatedSetupData: any,
) {
  try {
    const payload = await getPayload({ config: configPromise })

    // 1. Simpan report
    const newReport = await payload.create({
      collection: 'reports_gl',
      data: {
        guild_id: guildId,
        report_name: reportData.report_name,
        match_status: reportData.match_status,
        match_score: reportData.match_score,
        member_reports: reportData.member_reports,
        match_date: new Date().toISOString(),
      },
    })

    // 2. Update guild wins/losses/trends
    const guild = await payload.findByID({
      collection: 'guilds',
      id: guildId,
    })

    const currentWins = guild.gl_wins || 0
    const currentLosses = guild.gl_losses || 0
    const currentTrends = guild.gl_trends || ''

    const newTrend = reportData.match_status === 'win' ? 'W' : 'L'
    const updatedTrends = (currentTrends + newTrend).slice(-5)

    await payload.update({
      collection: 'guilds',
      id: guildId,
      data: {
        gl_wins: reportData.match_status === 'win' ? currentWins + 1 : currentWins,
        gl_losses: reportData.match_status === 'loss' ? currentLosses + 1 : currentLosses,
        gl_trends: updatedTrends,
      },
    })

    // 3. Bulk fetch characters to avoid sequential DB lookups
    const charIds = reportData.member_reports.map((mr: any) => mr.character_id)
    const charactersRes = await payload.find({
      collection: 'characters',
      where: { id: { in: charIds } },
      limit: 1000,
    })

    const charMap = new Map()
    charactersRes.docs.forEach((doc) => charMap.set(doc.id, doc))

    // Process updates in chunks to speed up without overwhelming Postgres connection pool
    // (Supabase session pool limit is typically 15, we use 10 to maximize speed)
    const CHUNK_SIZE = 10;
    for (let i = 0; i < reportData.member_reports.length; i += CHUNK_SIZE) {
      const chunk = reportData.member_reports.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (memberReport: any) => {
          const charId = memberReport.character_id
          const char = charMap.get(charId)
          if (!char) return

          const totalScore = (char.gl_total_score || 0) + (memberReport.actual_score || 0)
          const presentCount = (char.gl_present_count || 0) + (memberReport.is_present ? 1 : 0)
          const absentCount = (char.gl_absent_count || 0) + (memberReport.is_present ? 0 : 1)

          await payload.update({
            collection: 'characters',
            id: charId,
            data: {
              gl_total_score: totalScore,
              gl_present_count: presentCount,
              gl_absent_count: absentCount,
            },
          })
        })
      );
    }

    // 4. Update party setup: remove absent players from parties
    if (setupId && updatedSetupData) {
      const absentCharIds = reportData.member_reports
        .filter((mr: { is_present: any }) => !mr.is_present)
        .map((mr: { character_id: any }) => mr.character_id)

      const newSetup = JSON.parse(JSON.stringify(updatedSetupData))

      const removeAbsent = (parties: any[]) => {
        parties.forEach((party: any) => {
          party.slots.forEach((slot: any) => {
            const assignedId = slot.assigned_character?.id || slot.assigned_character
            if (assignedId && absentCharIds.includes(assignedId)) {
              slot.assigned_character = null
            }
          })
        })
      }

      if (newSetup.elite_parties) removeAbsent(newSetup.elite_parties)
      if (newSetup.sub_parties) removeAbsent(newSetup.sub_parties)

      await payload.update({
        collection: 'party_setups',
        id: setupId,
        data: {
          elite_parties: newSetup.elite_parties,
          sub_parties: newSetup.sub_parties,
        },
      })
    }

    revalidatePath('/')
    revalidatePath('/report-gl')
    revalidatePath('/dashboard')

    return { success: true, reportId: newReport.id }
  } catch (error: any) {
    console.error('Error saving report:', error)
    return { success: false, message: error.message }
  }
}
