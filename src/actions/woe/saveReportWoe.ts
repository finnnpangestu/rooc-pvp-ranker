'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { revalidatePath } from 'next/cache'

export async function saveReportWoe(
  guildId: string,
  setupId: string,
  reportData: any,
  updatedSetupData: any,
) {
  try {
    const payload = await getPayload({ config: configPromise })

    // 1. Simpan report
    const newReport = await payload.create({
      collection: 'reports_woe',
      data: {
        guild_id: guildId,
        report_name: reportData.report_name,
        match_rank: reportData.match_rank,
        member_reports: reportData.member_reports,
        match_date: new Date().toISOString(),
      },
    })

    // 2. Bulk fetch characters to avoid sequential DB lookups
    const charIds = reportData.member_reports.map((mr: any) => mr.character_id)
    const charactersRes = await payload.find({
      collection: 'characters',
      where: { id: { in: charIds } },
      limit: 1000,
    })

    const charMap = new Map()
    charactersRes.docs.forEach((doc) => charMap.set(doc.id, doc))

    // Process updates sequentially to completely avoid Supabase pool limit (EMAXCONNSESSION)
    for (const memberReport of reportData.member_reports) {
      const charId = memberReport.character_id
      const char = charMap.get(charId)
      if (!char) continue

      const presentCount = (char.woe_present_count || 0) + (memberReport.is_present ? 1 : 0)
      const absentCount = (char.woe_absent_count || 0) + (memberReport.is_present ? 0 : 1)

      await payload.update({
        collection: 'characters',
        id: charId,
        data: {
          woe_present_count: presentCount,
          woe_absent_count: absentCount,
        },
      })
    }

    // 3. Update party setup: remove absent players from parties and update swaps
    if (setupId && updatedSetupData) {
      const absentCharIds = reportData.member_reports
        .filter((mr: { is_present: any }) => !mr.is_present)
        .map((mr: { character_id: any }) => mr.character_id)

      const newSetup = JSON.parse(JSON.stringify(updatedSetupData))

      const removeAbsent = (raids: any[]) => {
        raids.forEach((raid: any) => {
          raid.parties.forEach((party: any) => {
            party.slots.forEach((slot: any) => {
              const assignedId = slot.assigned_character?.id || slot.assigned_character
              if (assignedId && absentCharIds.includes(assignedId)) {
                slot.assigned_character = null
              }
            })
          })
        })
      }

      if (newSetup.raids) removeAbsent(newSetup.raids)

      await payload.update({
        collection: 'woe_setups',
        id: setupId,
        data: {
          raids: newSetup.raids,
        },
      })
    }

    revalidatePath('/')
    revalidatePath('/report-woe')
    revalidatePath('/dashboard')

    return { success: true, reportId: newReport.id }
  } catch (error: any) {
    console.error('Error saving WoE report:', error)
    return { success: false, message: error.message }
  }
}
