import type { CharacterStatsInput } from '@/types'

type StatWeights = {
  hp_weight: number
  def_weight: number
  atk_weight: number
  pen_weight: number
  dmg_bonus_weight: number
  dmg_reduction_weight: number
  utility_weight: number
}

const JOB_WEIGHTS: Record<string, StatWeights> = {
  paladin: {
    hp_weight: 2.2,
    def_weight: 1.2,
    atk_weight: 0.8,
    pen_weight: 0.8,
    dmg_bonus_weight: 1.0,
    dmg_reduction_weight: 2.2,
    utility_weight: 1.4,
  },

  lord_knight: {
    hp_weight: 1.8,
    def_weight: 0.8,
    atk_weight: 1.6,
    pen_weight: 1.4,
    dmg_bonus_weight: 1.4,
    dmg_reduction_weight: 1.2,
    utility_weight: 0.8,
  },

  high_priest: {
    hp_weight: 1.8,
    def_weight: 0.8,
    atk_weight: 1.0,
    pen_weight: 0.4,
    dmg_bonus_weight: 0.6,
    dmg_reduction_weight: 2.0,
    utility_weight: 2.6,
  },

  champion: {
    hp_weight: 1.6,
    def_weight: 0.6,
    atk_weight: 2.2,
    pen_weight: 2.2,
    dmg_bonus_weight: 2.0,
    dmg_reduction_weight: 0.8,
    utility_weight: 0.6,
  },

  assassin_cross: {
    hp_weight: 1.4,
    def_weight: 0.4,
    atk_weight: 2.4,
    pen_weight: 2.4,
    dmg_bonus_weight: 2.2,
    dmg_reduction_weight: 0.6,
    utility_weight: 1.0,
  },

  stalker: {
    hp_weight: 1.6,
    def_weight: 0.6,
    atk_weight: 1.8,
    pen_weight: 1.8,
    dmg_bonus_weight: 1.6,
    dmg_reduction_weight: 1.0,
    utility_weight: 1.8,
  },

  high_wizard: {
    hp_weight: 1.2,
    def_weight: 0.4,
    atk_weight: 2.4,
    pen_weight: 2.2,
    dmg_bonus_weight: 2.2,
    dmg_reduction_weight: 0.6,
    utility_weight: 1.4,
  },

  professor: {
    hp_weight: 1.8,
    def_weight: 0.6,
    atk_weight: 1.4,
    pen_weight: 1.4,
    dmg_bonus_weight: 1.2,
    dmg_reduction_weight: 1.6,
    utility_weight: 2.2,
  },

  sniper: {
    hp_weight: 1.2,
    def_weight: 0.4,
    atk_weight: 2.4,
    pen_weight: 2.2,
    dmg_bonus_weight: 2.0,
    dmg_reduction_weight: 0.6,
    utility_weight: 1.2,
  },

  minstrell: {
    hp_weight: 1.8,
    def_weight: 0.6,
    atk_weight: 1.2,
    pen_weight: 0.4,
    dmg_bonus_weight: 0.6,
    dmg_reduction_weight: 1.8,
    utility_weight: 2.8,
  },

  gypsy: {
    hp_weight: 1.8,
    def_weight: 0.6,
    atk_weight: 1.2,
    pen_weight: 0.4,
    dmg_bonus_weight: 0.6,
    dmg_reduction_weight: 1.8,
    utility_weight: 2.8,
  },

  mastersmith: {
    hp_weight: 1.6,
    def_weight: 0.6,
    atk_weight: 2.2,
    pen_weight: 2.0,
    dmg_bonus_weight: 2.0,
    dmg_reduction_weight: 0.8,
    utility_weight: 1.2,
  },

  biochemist: {
    hp_weight: 1.8,
    def_weight: 0.6,
    atk_weight: 2.0,
    pen_weight: 1.8,
    dmg_bonus_weight: 1.8,
    dmg_reduction_weight: 1.2,
    utility_weight: 1.6,
  },

  summoner: {
    hp_weight: 1.8,
    def_weight: 0.6,
    atk_weight: 1.8,
    pen_weight: 1.6,
    dmg_bonus_weight: 1.6,
    dmg_reduction_weight: 1.2,
    utility_weight: 1.8,
  },

  adept_novice: {
    hp_weight: 1.6,
    def_weight: 0.5,
    atk_weight: 2.0,
    pen_weight: 1.8,
    dmg_bonus_weight: 1.8,
    dmg_reduction_weight: 0.8,
    utility_weight: 1.8,
  },

  rebellion: {
    hp_weight: 1.2,
    def_weight: 0.4,
    atk_weight: 2.6,
    pen_weight: 2.4,
    dmg_bonus_weight: 2.4,
    dmg_reduction_weight: 0.6,
    utility_weight: 1.0,
  },
}

// --- KONSTANTA ENGINE ROOC ---
const PVP_FLAT_CONVERSION = 180
const GENERAL_FLAT_CONVERSION = 50

export const calculatePvPScore = (data: CharacterStatsInput): number => {
  const job = (data.job || 'paladin') as string
  const weights = JOB_WEIGHTS[job] || JOB_WEIGHTS['paladin']

  const num = (val: unknown): number => (val !== undefined && val !== null ? Number(val) || 0 : 0)

  // 1. HP stat
  const totalHPValue = num(data.max_hp) / 1000

  // 2. Base stats (ATK, MATK, DEF, MDEF)
  const patk = num(data.patk) / 100
  const matk = num(data.matk) / 100
  const pdef = num(data.pdef) / 100
  const mdef = num(data.mdef) / 100

  // 3. Attack Stat
  const isMagicDps = ['high_wizard', 'professor', 'high_priest', 'summoner'].includes(job)
  const baseMainAtk = isMagicDps ? matk : patk
  const refineAtk = isMagicDps ? num(data.refine_matk) : num(data.refine_patk)
  const mainAtk = baseMainAtk + refineAtk / GENERAL_FLAT_CONVERSION

  // Ignore PDEF/MDEF (Flat)
  const rawPenetration = isMagicDps ? num(data.ignore_mdef) : num(data.ignore_pdef)
  const mainPenetration = rawPenetration / GENERAL_FLAT_CONVERSION

  const refineDef = (num(data.refine_pdef) + num(data.refine_mdef)) / GENERAL_FLAT_CONVERSION
  const totalDef = pdef + mdef + refineDef

  // 4. Damage Reduction
  const pdmgRed = num(data.pdmg_reduction)
  const mdmgRed = num(data.mdmg_reduction)
  const dmgRedDemi = num(data.dmg_reduction_demi_human)
  const dmgRedMed = num(data.dmg_reduction_medium)
  const neutralRed = num(data.neutral_dmg_reduction)
  const critDmgRed = num(data.critical_damage_reduction)
  const flatPvPRed = num(data.pvp_dmg_reduction) / PVP_FLAT_CONVERSION

  const fireRed = num(data.fire_dmg_reduction)
  const waterRed = num(data.water_dmg_reduction)
  const windRed = num(data.wind_dmg_reduction)
  const earthRed = num(data.earth_dmg_reduction)
  const ghostRed = num(data.ghost_dmg_reduction)
  const holyRed = num(data.holy_dmg_reduction)
  const poisonRed = num(data.poison_dmg_reduction)

  const totalElementalRed =
    (fireRed + waterRed + windRed + earthRed + ghostRed + holyRed + poisonRed) / 4

  const totalDmgReduction =
    pdmgRed +
    mdmgRed +
    dmgRedDemi +
    dmgRedMed +
    neutralRed +
    critDmgRed +
    flatPvPRed +
    totalElementalRed

  // 5. Damage Bonus
  const pdmgBonus = num(data.pdmg_bonus) / GENERAL_FLAT_CONVERSION
  const mdmgBonus = num(data.mdmg_bonus) / GENERAL_FLAT_CONVERSION
  const flatPvPBonus = num(data.pvp_dmg_bonus) / PVP_FLAT_CONVERSION

  const dmgVsDemi = num(data.dmg_vs_demi_human)
  const dmgVsMed = num(data.dmg_vs_medium)
  const neutralBonus = num(data.neutral_dmg_bonus)

  const fireBonus = num(data.fire_dmg_bonus)
  const waterBonus = num(data.water_dmg_bonus)
  const windBonus = num(data.wind_dmg_bonus)
  const earthBonus = num(data.earth_dmg_bonus)
  const ghostBonus = num(data.ghost_dmg_bonus)
  const holyBonus = num(data.holy_dmg_bonus)
  const poisonBonus = num(data.poison_dmg_bonus)

  const maxElementalBonus = Math.max(
    fireBonus,
    waterBonus,
    windBonus,
    earthBonus,
    ghostBonus,
    holyBonus,
    poisonBonus,
  )

  const totalDmgBonus =
    (isMagicDps ? mdmgBonus : pdmgBonus) +
    flatPvPBonus +
    dmgVsDemi +
    dmgVsMed +
    neutralBonus +
    maxElementalBonus

  // 6. Utility Score
  const utilityScore =
    num(data.healing_done) +
    num(data.healing_taken) +
    num(data.critical_reduction) * 0.1 +
    num(data.variable_cast) * 0.5 +
    num(data.aspd) * 0.1

  // 7. Final Score
  const score =
    totalHPValue * weights.hp_weight +
    totalDef * weights.def_weight +
    mainAtk * weights.atk_weight +
    mainPenetration * weights.pen_weight +
    totalDmgBonus * weights.dmg_bonus_weight +
    totalDmgReduction * weights.dmg_reduction_weight +
    utilityScore * weights.utility_weight

  return Math.round(score)
}
