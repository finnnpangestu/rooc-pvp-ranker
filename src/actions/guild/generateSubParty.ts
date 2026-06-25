'use server'

export async function generateSubParty(
  guildId: string,
  blueprint: string[][],
  benchMembers: any[],
) {
  try {
    const guildMembers = benchMembers.filter((m) => String(m.guild_id) === String(guildId))

    const availableMembers = [...guildMembers].sort(
      (a, b) => (b.pvp_score || 0) - (a.pvp_score || 0),
    )
    const subParties: any[] = []
    const totalSubParties = blueprint.length

    for (let i = 0; i < totalSubParties; i++) {
      subParties.push({
        party_name: `Sub Party ${i + 1}`,
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

    return { success: true as const, parties: subParties }
  } catch (error: any) {
    return { success: false as const, message: error.message }
  }
}
