'use server'

export async function generateEliteParty(guildId: string, blueprint: string[][], members: any[]) {
  try {
    // 1. Sort by PvP Score
    const availableMembers = [...members].sort((a, b) => (b.pvp_score || 0) - (a.pvp_score || 0))

    const eliteParties: any[] = []

    // 2. Prepare 8 Party slots
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

    // 3. Round-Robin Distribution (Slot per Slot, across Party 1-8)
    for (let slotIdx = 0; slotIdx < 5; slotIdx++) {
      for (let partyIdx = 0; partyIdx < 8; partyIdx++) {
        if (availableMembers.length === 0) break

        const requestedJob = blueprint[partyIdx][slotIdx]
        let selectedIndex = -1

        if (requestedJob !== 'any') {
          selectedIndex = availableMembers.findIndex((m) => m.job === requestedJob)
        }
        if (selectedIndex === -1) {
          selectedIndex = 0
        }

        if (selectedIndex !== -1) {
          // Store the full member object so the UI can display name/job/score
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
