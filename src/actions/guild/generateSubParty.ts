'use server'

import type { Character, Party, ActionResult } from '@/types'
import { actionError, actionSuccess, formatErrorMessage } from '@/types'

export async function generateSubParty(
  guildId: string,
  blueprint: string[][],
  benchMembers: Character[],
): Promise<ActionResult<{ parties: Party[] }> & { parties?: Party[] }> {
  try {
    const guildMembers = benchMembers.filter((m) => String(m.guild_id) === String(guildId))

    const availableMembers = [...guildMembers].sort(
      (a, b) => Number(b.pvp_score || 0) - Number(a.pvp_score || 0),
    )
    const subParties: Party[] = []
    const totalSubParties = blueprint.length

    for (let i = 0; i < totalSubParties; i++) {
      const subPartyGroup = Math.floor(i / 8) + 1
      const partyInGroup = (i % 8) + 1
      subParties.push({
        name: `Sub Party ${subPartyGroup} - P${partyInGroup}`,
        type: 'sub',
        slots: blueprint[i].map((job) => ({ required_job: job, assigned_character: null })),
      })
    }

    for (let slotIdx = 0; slotIdx < 5; slotIdx++) {
      for (let partyIdx = 0; partyIdx < totalSubParties; partyIdx++) {
        if (availableMembers.length === 0) break

        const requestedJob = blueprint[partyIdx][slotIdx]
        let selectedIndex = -1

        if (requestedJob === 'any') {
          selectedIndex = 0
        } else {
          selectedIndex = availableMembers.findIndex((m) => m.job === requestedJob)
        }

        if (selectedIndex !== -1) {
          subParties[partyIdx].slots[slotIdx].assigned_character = availableMembers[selectedIndex]
          availableMembers.splice(selectedIndex, 1)
        }
      }
    }

    const successRes = actionSuccess({ parties: subParties })
    return { ...successRes, parties: subParties }
  } catch (error: unknown) {
    return actionError(formatErrorMessage(error))
  }
}
