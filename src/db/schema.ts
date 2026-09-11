import { relations, type InferSelectModel, type InferInsertModel } from 'drizzle-orm'
import {
  pgTable,
  varchar,
  timestamp,
  numeric,
  boolean,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core'

// Enums
export const enumUsersRole = pgEnum('enum_users_role', ['super_admin', 'guild_master'])

export const enumCharactersJob = pgEnum('enum_characters_job', [
  'lord_knight',
  'paladin',
  'high_priest',
  'champion',
  'assassin_cross',
  'stalker',
  'high_wizard',
  'professor',
  'sniper',
  'minstrell',
  'gypsy',
  'mastersmith',
  'biochemist',
  'summoner',
  'adept_novice',
  'rebellion',
])

export const enumMatchStatus = pgEnum('enum_reports_gl_match_status', ['win', 'loss'])

// ==========================================
// JSONB Contracts & Sub-Models
// ==========================================

export interface PartySlotCharacter {
  id: string
  name?: string
  job?: string
  pvp_score?: number | string | null
  avatar_url?: string | null
  [key: string]: unknown
}

export interface PartySlot {
  slot_index?: number
  required_job?: string | null
  assigned_character?: PartySlotCharacter | string | null
}

export interface Party {
  id?: string
  name?: string
  party_name?: string
  type?: 'elite' | 'sub'
  slots: PartySlot[]
}

export interface WoeRaid {
  id?: string
  name?: string
  raid_name?: string
  parties: Party[]
}

export interface MemberMatchReport {
  character_id: string | PartySlotCharacter
  character_name?: string
  job?: string
  is_present?: boolean
  status?: 'present' | 'absent'
  actual_score?: number | string | null
  score?: number
  party_assigned?: string
  kills?: number
  deaths?: number
  notes?: string
}

export interface CharacterGlReport {
  date?: string
  opponent?: string
  result?: 'win' | 'lose'
  score?: number
  attendance?: 'present' | 'absent'
}

// Users
export const users = pgTable('users', {
  id: varchar('id').primaryKey(),
  name: varchar('name'),
  email: varchar('email').notNull().unique(),
  password: varchar('password').notNull(),
  role: enumUsersRole('role').default('guild_master').notNull(),
  reset_password_token: varchar('reset_password_token'),
  reset_password_expiration: timestamp('reset_password_expiration', { withTimezone: true, mode: 'string' }),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
})

// Guilds
export const guilds = pgTable('guilds', {
  id: varchar('id').primaryKey(),
  name: varchar('name').notNull(),
  guild_master_id: varchar('guild_master_id').notNull(),
  total_characters: numeric('total_characters').default('0'),
  total_pvp_score: numeric('total_pvp_score').default('0'),
  gl_wins: numeric('gl_wins').default('0'),
  gl_losses: numeric('gl_losses').default('0'),
  gl_trends: varchar('gl_trends'),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
})

// Characters
export const characters = pgTable('characters', {
  id: varchar('id').primaryKey(),
  name: varchar('name').notNull(),
  job: enumCharactersJob('job').notNull(),
  guild_id: varchar('guild_id').notNull(),
  isVerified: boolean('is_verified').default(false),
  
  // General Stats
  max_hp: numeric('max_hp').default('0').notNull(),
  patk: numeric('patk').default('0'),
  matk: numeric('matk').default('0'),
  pdef: numeric('pdef').default('0'),
  mdef: numeric('mdef').default('0'),
  refine_patk: numeric('refine_patk').default('0'),
  refine_matk: numeric('refine_matk').default('0'),
  refine_pdef: numeric('refine_pdef').default('0'),
  refine_mdef: numeric('refine_mdef').default('0'),
  hit: numeric('hit').default('0'),
  flee: numeric('flee').default('0'),
  
  // Quasi Stats
  aspd: numeric('aspd').default('0'),
  mspd: numeric('mspd').default('0'),
  variable_cast: numeric('variable_cast').default('0'),
  fixed_cast: numeric('fixed_cast').default('0'),
  healing_done: numeric('healing_done').default('0'),
  healing_taken: numeric('healing_taken').default('0'),
  critical: numeric('critical').default('0'),
  critical_damage: numeric('critical_damage').default('0'),
  critical_reduction: numeric('critical_reduction').default('0'),
  critical_damage_reduction: numeric('critical_damage_reduction').default('0'),
  pdmg: numeric('pdmg').default('0'),
  mdmg: numeric('mdmg').default('0'),
  pdmg_reduction: numeric('pdmg_reduction').default('0'),
  mdmg_reduction: numeric('mdmg_reduction').default('0'),
  ignore_pdef: numeric('ignore_pdef').default('0'),
  ignore_mdef: numeric('ignore_mdef').default('0'),
  pdmg_bonus: numeric('pdmg_bonus').default('0'),
  mdmg_bonus: numeric('mdmg_bonus').default('0'),
  pvp_dmg_bonus: numeric('pvp_dmg_bonus').default('0'),
  pvp_dmg_reduction: numeric('pvp_dmg_reduction').default('0'),

  // Special Stats
  max_hp_percentage: numeric('max_hp_percentage').default('0'),
  equipment_patk_percentage: numeric('equipment_patk_percentage').default('0'),
  equipment_matk_percentage: numeric('equipment_matk_percentage').default('0'),
  equipment_pdef_percentage: numeric('equipment_pdef_percentage').default('0'),
  equipment_mdef_percentage: numeric('equipment_mdef_percentage').default('0'),
  dmg_vs_demi_human: numeric('dmg_vs_demi_human').default('0'),
  dmg_reduction_demi_human: numeric('dmg_reduction_demi_human').default('0'),
  dmg_vs_medium: numeric('dmg_vs_medium').default('0'),
  dmg_reduction_medium: numeric('dmg_reduction_medium').default('0'),
  neutral_dmg_bonus: numeric('neutral_dmg_bonus').default('0'),
  neutral_dmg_reduction: numeric('neutral_dmg_reduction').default('0'),
  fire_dmg_bonus: numeric('fire_dmg_bonus').default('0'),
  fire_dmg_reduction: numeric('fire_dmg_reduction').default('0'),
  water_dmg_bonus: numeric('water_dmg_bonus').default('0'),
  water_dmg_reduction: numeric('water_dmg_reduction').default('0'),
  wind_dmg_bonus: numeric('wind_dmg_bonus').default('0'),
  wind_dmg_reduction: numeric('wind_dmg_reduction').default('0'),
  earth_dmg_bonus: numeric('earth_dmg_bonus').default('0'),
  earth_dmg_reduction: numeric('earth_dmg_reduction').default('0'),
  ghost_dmg_bonus: numeric('ghost_dmg_bonus').default('0'),
  ghost_dmg_reduction: numeric('ghost_dmg_reduction').default('0'),
  holy_dmg_bonus: numeric('holy_dmg_bonus').default('0'),
  holy_dmg_reduction: numeric('holy_dmg_reduction').default('0'),
  poison_dmg_bonus: numeric('poison_dmg_bonus').default('0'),
  poison_dmg_reduction: numeric('poison_dmg_reduction').default('0'),

  // Total Scores & Reports
  pvp_score: numeric('pvp_score').default('0'),
  gl_total_score: numeric('gl_total_score').default('0'),
  gl_reports: jsonb('gl_reports').$type<CharacterGlReport[]>().default([]),
  woe_present_count: numeric('woe_present_count').default('0'),
  woe_absent_count: numeric('woe_absent_count').default('0'),
  gl_present_count: numeric('gl_present_count').default('0'),
  gl_absent_count: numeric('gl_absent_count').default('0'),
  total_resources: numeric('total_resources').default('0'),

  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
})

// Party Setups (Guild League)
export const partySetups = pgTable('party_setups', {
  id: varchar('id').primaryKey(),
  guild_id: varchar('guild_id').notNull().unique(),
  elite_parties: jsonb('elite_parties').$type<Party[]>().default([]),
  sub_parties: jsonb('sub_parties').$type<Party[]>().default([]),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
})

// Reports GL
export const reportsGl = pgTable('reports_gl', {
  id: varchar('id').primaryKey(),
  guild_id: varchar('guild_id').notNull(),
  report_name: varchar('report_name').notNull(),
  match_status: enumMatchStatus('match_status').notNull(),
  match_score: numeric('match_score').default('0'),
  match_date: timestamp('match_date', { withTimezone: true, mode: 'string' }),
  member_reports: jsonb('member_reports').$type<MemberMatchReport[]>().default([]),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
})

// Reports WoE
export const reportsWoe = pgTable('reports_woe', {
  id: varchar('id').primaryKey(),
  guild_id: varchar('guild_id').notNull(),
  report_name: varchar('report_name').notNull(),
  match_rank: numeric('match_rank'),
  match_date: timestamp('match_date', { withTimezone: true, mode: 'string' }),
  member_reports: jsonb('member_reports').$type<MemberMatchReport[]>().default([]),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
})

// WoE Setups
export const woeSetups = pgTable('woe_setups', {
  id: varchar('id').primaryKey(),
  guild_id: varchar('guild_id').notNull().unique(),
  raids: jsonb('raids').$type<WoeRaid[]>().default([]),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
})

// Resources
export const resources = pgTable('resources', {
  id: varchar('id').primaryKey(),
  guild_id: varchar('guild_id').notNull(),
  name: varchar('name').notNull(),
  total_quantity: numeric('total_quantity').notNull(),
  remaining_quantity: numeric('remaining_quantity').notNull(),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
})

// Resource Distributions
export const resourceDistributions = pgTable('resource_distributions', {
  id: varchar('id').primaryKey(),
  guild_id: varchar('guild_id').notNull(),
  resource_id: varchar('resource_id').notNull(),
  member_id: varchar('member_id').notNull(),
  quantity: numeric('quantity').notNull(),
  bid_date: timestamp('bid_date', { withTimezone: true, mode: 'string' }),
  status: varchar('status').default('pending').notNull(),
  notes: varchar('notes'),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
})

// Media
export const media = pgTable('media', {
  id: varchar('id').primaryKey(),
  alt: varchar('alt').notNull(),
  url: varchar('url'),
  thumbnail_url: varchar('thumbnail_url'),
  filename: varchar('filename'),
  mime_type: varchar('mime_type'),
  filesize: numeric('filesize'),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
})

// Drizzle Relations for relational queries (db.query)
export const usersRelations = relations(users, ({ many }) => ({
  guilds: many(guilds),
}))

export const guildsRelations = relations(guilds, ({ one, many }) => ({
  guildMaster: one(users, {
    fields: [guilds.guild_master_id],
    references: [users.id],
  }),
  characters: many(characters),
  partySetup: one(partySetups),
  woeSetup: one(woeSetups),
  reportsGl: many(reportsGl),
  reportsWoe: many(reportsWoe),
  resources: many(resources),
  resourceDistributions: many(resourceDistributions),
}))

export const charactersRelations = relations(characters, ({ one, many }) => ({
  guild: one(guilds, {
    fields: [characters.guild_id],
    references: [guilds.id],
  }),
  resourceDistributions: many(resourceDistributions),
}))

export const partySetupsRelations = relations(partySetups, ({ one }) => ({
  guild: one(guilds, {
    fields: [partySetups.guild_id],
    references: [guilds.id],
  }),
}))

export const reportsGlRelations = relations(reportsGl, ({ one }) => ({
  guild: one(guilds, {
    fields: [reportsGl.guild_id],
    references: [guilds.id],
  }),
}))

export const reportsWoeRelations = relations(reportsWoe, ({ one }) => ({
  guild: one(guilds, {
    fields: [reportsWoe.guild_id],
    references: [guilds.id],
  }),
}))

export const woeSetupsRelations = relations(woeSetups, ({ one }) => ({
  guild: one(guilds, {
    fields: [woeSetups.guild_id],
    references: [guilds.id],
  }),
}))

export const resourcesRelations = relations(resources, ({ one, many }) => ({
  guild: one(guilds, {
    fields: [resources.guild_id],
    references: [guilds.id],
  }),
  distributions: many(resourceDistributions),
}))

export const resourceDistributionsRelations = relations(resourceDistributions, ({ one }) => ({
  guild: one(guilds, {
    fields: [resourceDistributions.guild_id],
    references: [guilds.id],
  }),
  resource: one(resources, {
    fields: [resourceDistributions.resource_id],
    references: [resources.id],
  }),
  member: one(characters, {
    fields: [resourceDistributions.member_id],
    references: [characters.id],
  }),
}))

// ==========================================
// Table Inferred Types (Drizzle Models)
// ==========================================
export type User = InferSelectModel<typeof users>
export type NewUser = InferInsertModel<typeof users>

export type Guild = InferSelectModel<typeof guilds>
export type NewGuild = InferInsertModel<typeof guilds>

export type Character = InferSelectModel<typeof characters>
export type NewCharacter = InferInsertModel<typeof characters>

export type PartySetup = InferSelectModel<typeof partySetups>
export type NewPartySetup = InferInsertModel<typeof partySetups>

export type ReportGl = InferSelectModel<typeof reportsGl>
export type NewReportGl = InferInsertModel<typeof reportsGl>

export type ReportWoe = InferSelectModel<typeof reportsWoe>
export type NewReportWoe = InferInsertModel<typeof reportsWoe>

export type WoeSetup = InferSelectModel<typeof woeSetups>
export type NewWoeSetup = InferInsertModel<typeof woeSetups>

export type Resource = InferSelectModel<typeof resources>
export type NewResource = InferInsertModel<typeof resources>

export type ResourceDistribution = InferSelectModel<typeof resourceDistributions>
export type NewResourceDistribution = InferInsertModel<typeof resourceDistributions>

export type Media = InferSelectModel<typeof media>
export type NewMedia = InferInsertModel<typeof media>

