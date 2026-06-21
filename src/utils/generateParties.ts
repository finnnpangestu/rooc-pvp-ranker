// src/utils/generateParties.ts
import { Character } from '@/payload-types'

export type Party = {
  id: number
  tank: Character | null
  supports: Character[]
  dps: Character[]
  total_party_score: number
}

export const generateParties = (characters: Character[]): Party[] => {
  // 1. Sorting
  const sortedChars = [...characters].sort((a, b) => (b.pvp_score ?? 0) - (a.pvp_score ?? 0))

  // 2. Roles Bucket
  const tanks: Character[] = []
  const supports: Character[] = []
  const dps: Character[] = []

  // Category
  sortedChars.forEach((char) => {
    if (['paladin', 'lord_knight'].includes(char.job)) {
      tanks.push(char)
    } else if (['high_priest', 'minstrell', 'gypsy'].includes(char.job)) {
      supports.push(char)
    } else {
      // Remaining jobs
      dps.push(char)
    }
  })

  // 3. Elite Squad (8 Tank, 16 Support, 16 DPS)
  const eliteTanks = tanks.slice(0, 8)
  const eliteSupports = supports.slice(0, 16)
  const eliteDps = dps.slice(0, 16)

  // 4. Initialize 8 Party
  const parties: Party[] = Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    tank: null,
    supports: [],
    dps: [],
    total_party_score: 0,
  }))

  // 5. Matchmaking

  // A. Tank (Round Robin: Rank 1 -> Party 1, Rank 8 -> Party 8)
  eliteTanks.forEach((tank, index) => {
    parties[index].tank = tank
  })

  // B. Support (Snake Draft untuk 16 orang)
  eliteSupports.forEach((support, index) => {
    const partyIndex = index < 8 ? index : 15 - index
    parties[partyIndex].supports.push(support)
  })

  // C. DPS (Snake Draft untuk 16 orang)
  eliteDps.forEach((dpsChar, index) => {
    const partyIndex = index < 8 ? index : 15 - index
    parties[partyIndex].dps.push(dpsChar)
  })

  // 6. Calculate Total Score per Party for balance checking
  parties.forEach((party) => {
    const tankScore = party.tank ? (party.tank.pvp_score ?? 0) : 0
    const supportScore = party.supports.reduce((acc, curr) => acc + (curr.pvp_score ?? 0), 0)
    const dpsScore = party.dps.reduce((acc, curr) => acc + (curr.pvp_score ?? 0), 0)

    party.total_party_score = tankScore + supportScore + dpsScore
  })

  return parties.sort((a, b) => b.total_party_score - a.total_party_score)
}
