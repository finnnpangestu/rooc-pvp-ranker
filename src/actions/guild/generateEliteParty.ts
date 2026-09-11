'use server'

import type { Character, Party, ActionResult } from '@/types'
import { actionError, actionSuccess, formatErrorMessage } from '@/types'

export async function generateEliteParty(
  guildId: string,
  blueprint: string[][],
  members: Character[],
): Promise<ActionResult<{ parties: Party[] }> & { parties?: Party[] }> {
  try {
    const guildMembers = members.filter((m) => String(m.guild_id) === String(guildId))

    const availableMembers = [...guildMembers].sort(
      (a, b) => Number(b.pvp_score || 0) - Number(a.pvp_score || 0),
    )

    const eliteParties: Party[] = []

    for (let i = 0; i < 8; i++) {
      eliteParties.push({
        name: `Elite Party ${i + 1}`,
        type: 'elite',
        slots: [
          { required_job: blueprint[i][0], assigned_character: null },
          { required_job: blueprint[i][1], assigned_character: null },
          { required_job: blueprint[i][2], assigned_character: null },
          { required_job: blueprint[i][3], assigned_character: null },
          { required_job: blueprint[i][4], assigned_character: null },
        ],
      })
    }

    for (let slotIdx = 0; slotIdx < 5; slotIdx++) {
      for (let partyIdx = 0; partyIdx < 8; partyIdx++) {
        if (availableMembers.length === 0) break

        const requestedJob = blueprint[partyIdx][slotIdx]
        let selectedIndex = -1

        if (requestedJob === 'any') {
          selectedIndex = 0
        } else {
          selectedIndex = availableMembers.findIndex((m) => m.job === requestedJob)
        }

        if (selectedIndex !== -1) {
          eliteParties[partyIdx].slots[slotIdx].assigned_character = availableMembers[selectedIndex]
          availableMembers.splice(selectedIndex, 1)
        }
      }
    }

    const successRes = actionSuccess({ parties: eliteParties })
    return { ...successRes, parties: eliteParties }
  } catch (error: unknown) {
    return actionError(formatErrorMessage(error))
  }
}
