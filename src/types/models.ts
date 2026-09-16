export type {
  PartySlotCharacter,
  PartySlot,
  Party,
  WoeRaid,
  MemberMatchReport,
  CharacterGlReport,
  CharacterStatHistory,
  User,
  NewUser,
  Guild,
  NewGuild,
  Character,
  NewCharacter,
  PartySetup,
  NewPartySetup,
  ReportGl,
  NewReportGl,
  ReportWoe,
  NewReportWoe,
  WoeSetup,
  NewWoeSetup,
  Resource,
  NewResource,
  ResourceDistribution,
  NewResourceDistribution,
  Media,
  NewMedia,
} from '@/db/schema'

import type {
  Character,
  Guild,
  PartySetup,
  ReportGl,
  ReportWoe,
  Resource,
  ResourceDistribution,
  User,
  WoeSetup,
} from '@/db/schema'

// ==========================================
// RELATIONAL & COMPOSITE CONTRACTS
// ==========================================

export type CharacterWithGuild = Character & {
  guild?: Guild | null
}

export type PopulatedResource = Omit<Resource, 'total_quantity' | 'remaining_quantity'> & {
  total_quantity: number
  remaining_quantity: number
}

export type PopulatedMember = Omit<Character, 'pvp_score'> & {
  pvp_score?: number | string | null
}

export type ResourceDistributionWithRelations = Omit<
  ResourceDistribution,
  'resource_id' | 'member_id' | 'quantity'
> & {
  quantity: number | string
  resource?: Resource | PopulatedResource | null
  member?: Character | PopulatedMember | null
  resource_id?: PopulatedResource | null
  member_id?: PopulatedMember | null
}

export type GuildWithRelations = Guild & {
  guildMaster?: User | null
  characters?: Character[]
  partySetup?: PartySetup | null
  woeSetup?: WoeSetup | null
  reportsGl?: ReportGl[]
  reportsWoe?: ReportWoe[]
  resources?: Resource[]
  resourceDistributions?: ResourceDistributionWithRelations[]
}

// ==========================================
// STATS INPUT CONTRACT
// ==========================================

export type CharacterStatsInput = Partial<
  Omit<Character, 'id' | 'created_at' | 'updated_at' | 'job'>
> & {
  id?: string
  job?: Character['job'] | ''
  [key: string]: unknown
}
