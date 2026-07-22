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

    // 3. Update each character's gl_reports, gl_total_score, present/absent counts
    for (const memberReport of reportData.member_reports) {
      const charId = memberReport.character_id
      const char = await payload.findByID({
        collection: 'characters',
        id: charId,
      })

      const existingReports = char.gl_reports || []
      const newReportEntry = {
        report_id: newReport.id,
        is_present: memberReport.is_present,
        actual_score: memberReport.actual_score,
        party_assigned: memberReport.party_assigned,
      }
      const updatedReports = [...existingReports, newReportEntry]

      const totalScore = updatedReports.reduce((sum, r) => sum + (r.actual_score || 0), 0)
      const presentCount = updatedReports.filter((r) => r.is_present).length
      const absentCount = updatedReports.filter((r) => !r.is_present).length

      await payload.update({
        collection: 'characters',
        id: charId,
        data: {
          gl_reports: updatedReports,
          gl_total_score: totalScore,
          gl_present_count: presentCount,
          gl_absent_count: absentCount,
        },
      })
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
