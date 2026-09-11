'use server'

import { db } from '@/db'
import { characters, guilds, partySetups, reportsGl } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import type { Party, PartySetup, MemberMatchReport, ActionResult } from '@/types'
import { actionError, actionSuccess, formatErrorMessage } from '@/types'

export interface GLMemberReportInput {
  character_id: string
  is_present: boolean
  actual_score?: number | string
  [key: string]: unknown
}

export interface GLReportDataInput {
  report_name: string
  match_status: 'win' | 'loss'
  match_score?: number | string
  member_reports?: GLMemberReportInput[]
}

export async function saveReportGL(
  guildId: string,
  setupId: string,
  reportData: GLReportDataInput,
  updatedSetupData: Partial<PartySetup>,
): Promise<ActionResult<{ reportId: string }> & { reportId?: string }> {
  try {
    // 1. Simpan report
    const newReportId = crypto.randomUUID()
    const memberReportsToSave: MemberMatchReport[] = (reportData.member_reports || []).map((mr) => ({
      character_id: mr.character_id,
      status: mr.is_present ? 'present' : 'absent',
      score: mr.actual_score ? Number(mr.actual_score) : 0,
    }))

    await db.insert(reportsGl).values({
      id: newReportId,
      guild_id: guildId,
      report_name: reportData.report_name,
      match_status: reportData.match_status,
      match_score: reportData.match_score ? String(reportData.match_score) : '0',
      member_reports: memberReportsToSave,
      match_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    // 2. Update guild wins/losses/trends
    const guild = await db.query.guilds.findFirst({
      where: eq(guilds.id, guildId),
    })

    if (guild) {
      const currentWins = Number(guild.gl_wins) || 0
      const currentLosses = Number(guild.gl_losses) || 0
      const currentTrends = guild.gl_trends || ''

      const newTrend = reportData.match_status === 'win' ? 'W' : 'L'
      const updatedTrends = (currentTrends + newTrend).slice(-5)

      await db
        .update(guilds)
        .set({
          gl_wins: String(reportData.match_status === 'win' ? currentWins + 1 : currentWins),
          gl_losses: String(reportData.match_status === 'loss' ? currentLosses + 1 : currentLosses),
          gl_trends: updatedTrends,
          updated_at: new Date().toISOString(),
        })
        .where(eq(guilds.id, guildId))
    }

    // 3. Bulk fetch characters to update GL attendance & score
    const charIds = (reportData.member_reports || []).map((mr) => mr.character_id).filter(Boolean)
    if (charIds.length > 0) {
      const chars = await db.query.characters.findMany({
        where: inArray(characters.id, charIds),
      })

      const charMap = new Map<string, typeof chars[number]>()
      chars.forEach((c) => charMap.set(c.id, c))

      for (const memberReport of reportData.member_reports || []) {
        const char = charMap.get(memberReport.character_id)
        if (!char) continue

        const totalScore = (Number(char.gl_total_score) || 0) + (Number(memberReport.actual_score) || 0)
        const presentCount = (Number(char.gl_present_count) || 0) + (memberReport.is_present ? 1 : 0)
        const absentCount = (Number(char.gl_absent_count) || 0) + (memberReport.is_present ? 0 : 1)

        await db
          .update(characters)
          .set({
            gl_total_score: String(totalScore),
            gl_present_count: String(presentCount),
            gl_absent_count: String(absentCount),
            updated_at: new Date().toISOString(),
          })
          .where(eq(characters.id, memberReport.character_id))
      }
    }

    // 4. Update party setup: remove absent players from parties
    if (setupId && updatedSetupData) {
      const absentCharIds = (reportData.member_reports || [])
        .filter((mr) => !mr.is_present)
        .map((mr) => mr.character_id)

      const newSetup: Partial<PartySetup> = JSON.parse(JSON.stringify(updatedSetupData))

      const removeAbsent = (parties: Party[]) => {
        parties.forEach((party) => {
          party.slots.forEach((slot) => {
            const assignedId =
              typeof slot.assigned_character === 'object' && slot.assigned_character
                ? slot.assigned_character.id
                : slot.assigned_character
            if (assignedId && absentCharIds.includes(assignedId)) {
              slot.assigned_character = null
            }
          })
        })
      }

      if (newSetup.elite_parties) removeAbsent(newSetup.elite_parties)
      if (newSetup.sub_parties) removeAbsent(newSetup.sub_parties)

      await db
        .update(partySetups)
        .set({
          elite_parties: newSetup.elite_parties,
          sub_parties: newSetup.sub_parties,
          updated_at: new Date().toISOString(),
        })
        .where(eq(partySetups.id, setupId))
    }

    revalidatePath('/')
    revalidatePath('/report-gl')
    revalidatePath('/dashboard')

    const resSuccess = actionSuccess({ reportId: newReportId }, 'Laporan GL berhasil disimpan')
    return { ...resSuccess, reportId: newReportId }
  } catch (error: unknown) {
    console.error('Error saving report:', error)
    return actionError(formatErrorMessage(error))
  }
}
