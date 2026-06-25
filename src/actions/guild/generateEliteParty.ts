'use server'

export async function generateEliteParty(guildId: string, blueprint: string[][], members: any[]) {
  try {
    const availableMembers = [...members].sort((a, b) => (b.pvp_score || 0) - (a.pvp_score || 0))

    const eliteParties: any[] = []

    for (let i = 0; i < 8; i++) {
      eliteParties.push({
        party_name: `Elite Party ${i + 1}`,
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

    return { success: true as const, parties: eliteParties }
  } catch (error: any) {
    return { success: false as const, message: error.message }
  }
}
