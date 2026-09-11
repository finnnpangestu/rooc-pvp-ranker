'use server'

import { db } from '@/db'
import { characters, reportsWoe, woeSetups } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import type { WoeRaid, WoeSetup, MemberMatchReport, ActionResult } from '@/types'
import { actionError, actionSuccess, formatErrorMessage } from '@/types'

export interface WoeMemberReportInput {
  character_id: string
  is_present: boolean
  [key: string]: unknown
}

export interface WoeReportDataInput {
  report_name: string
  match_rank?: number | string | null
  member_reports?: WoeMemberReportInput[]
}

export async function saveReportWoe(
  guildId: string,
  setupId: string,
  reportData: WoeReportDataInput,
  updatedSetupData: Partial<WoeSetup>,
): Promise<ActionResult<{ reportId: string }> & { reportId?: string }> {
  try {
    // 1. Simpan report
    const newReportId = crypto.randomUUID()
    const memberReportsToSave: MemberMatchReport[] = (reportData.member_reports || []).map((mr) => ({
      character_id: mr.character_id,
      status: mr.is_present ? 'present' : 'absent',
    }))

    await db.insert(reportsWoe).values({
      id: newReportId,
      guild_id: guildId,
      report_name: reportData.report_name,
      match_rank: reportData.match_rank ? String(reportData.match_rank) : null,
      member_reports: memberReportsToSave,
      match_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    // 2. Fetch characters
    const charIds = (reportData.member_reports || []).map((mr) => mr.character_id).filter(Boolean)
    if (charIds.length > 0) {
      const chars = await db.query.characters.findMany({
        where: inArray(characters.id, charIds),
      })

      const charMap = new Map<string, typeof chars[number]>()
      chars.forEach((c) => charMap.set(c.id, c))

      for (const mr of reportData.member_reports || []) {
        const char = charMap.get(mr.character_id)
        if (!char) continue

        const presentCount = (Number(char.woe_present_count) || 0) + (mr.is_present ? 1 : 0)
        const absentCount = (Number(char.woe_absent_count) || 0) + (mr.is_present ? 0 : 1)

        await db
          .update(characters)
          .set({
            woe_present_count: String(presentCount),
            woe_absent_count: String(absentCount),
            updated_at: new Date().toISOString(),
          })
          .where(eq(characters.id, mr.character_id))
      }
    }

    // 3. Update party setup: remove absent players from parties and update swaps
    if (setupId && updatedSetupData) {
      const absentCharIds = (reportData.member_reports || [])
        .filter((mr) => !mr.is_present)
        .map((mr) => mr.character_id)

      const newSetup: Partial<WoeSetup> = JSON.parse(JSON.stringify(updatedSetupData))

      const removeAbsent = (raids: WoeRaid[]) => {
        raids.forEach((raid) => {
          raid.parties.forEach((party) => {
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
        })
      }

      if (newSetup.raids) removeAbsent(newSetup.raids)

      await db
        .update(woeSetups)
        .set({
          raids: newSetup.raids,
          updated_at: new Date().toISOString(),
        })
        .where(eq(woeSetups.id, setupId))
    }

    revalidatePath('/')
    revalidatePath('/report-woe')
    revalidatePath('/dashboard')

    const resSuccess = actionSuccess({ reportId: newReportId }, 'Laporan WoE berhasil disimpan')
    return { ...resSuccess, reportId: newReportId }
  } catch (error: unknown) {
    console.error('Error saving WoE report:', error)
    return actionError(formatErrorMessage(error))
  }
}
