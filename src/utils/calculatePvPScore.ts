import { Character } from '@/payload-types'

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
    hp_weight: 1.0,
    def_weight: 0.5,
    atk_weight: 0.1,
    pen_weight: 0.1,
    dmg_bonus_weight: 0.2,
    dmg_reduction_weight: 1.4,
    utility_weight: 0.3,
  },

  lord_knight: {
    hp_weight: 0.9,
    def_weight: 0.8,
    atk_weight: 1.2,
    pen_weight: 0.8,
    dmg_bonus_weight: 1.0,
    dmg_reduction_weight: 1.2,
    utility_weight: 0.5,
  },

  high_priest: {
    hp_weight: 0.9,
    def_weight: 0.5,
    atk_weight: 0.6,
    pen_weight: 0.2,
    dmg_bonus_weight: 0.3,
    dmg_reduction_weight: 1.0,
    utility_weight: 2.8,
  },

  minstrell: {
    hp_weight: 0.8,
    def_weight: 0.5,
    atk_weight: 1.6,
    pen_weight: 1.0,
    dmg_bonus_weight: 1.0,
    dmg_reduction_weight: 0.9,
    utility_weight: 2.2,
  },
  gypsy: {
    hp_weight: 0.8,
    def_weight: 0.5,
    atk_weight: 1.6,
    pen_weight: 1.0,
    dmg_bonus_weight: 1.0,
    dmg_reduction_weight: 0.9,
    utility_weight: 2.2,
  },

  assassin_cross: {
    hp_weight: 0.5,
    def_weight: 0.4,
    atk_weight: 2.4,
    pen_weight: 2.4,
    dmg_bonus_weight: 2.2,
    dmg_reduction_weight: 0.8,
    utility_weight: 1.2,
  },

  sniper: {
    hp_weight: 0.5,
    def_weight: 0.4,
    atk_weight: 2.4,
    pen_weight: 2.4,
    dmg_bonus_weight: 2.2,
    dmg_reduction_weight: 0.8,
    utility_weight: 1.5,
  },

  champion: {
    hp_weight: 0.6,
    def_weight: 0.5,
    atk_weight: 2.4,
    pen_weight: 2.2,
    dmg_bonus_weight: 2.0,
    dmg_reduction_weight: 0.9,
    utility_weight: 0.6,
  },

  mastersmith: {
    hp_weight: 0.6,
    def_weight: 0.5,
    atk_weight: 2.2,
    pen_weight: 2.0,
    dmg_bonus_weight: 2.0,
    dmg_reduction_weight: 0.9,
    utility_weight: 1.2,
  },

  stalker: {
    hp_weight: 0.6,
    def_weight: 0.5,
    atk_weight: 1.8,
    pen_weight: 1.8,
    dmg_bonus_weight: 1.8,
    dmg_reduction_weight: 1.0,
    utility_weight: 1.2,
  },

  high_wizard: {
    hp_weight: 0.5,
    def_weight: 0.4,
    atk_weight: 2.5,
    pen_weight: 2.4,
    dmg_bonus_weight: 2.4,
    dmg_reduction_weight: 0.8,
    utility_weight: 1.5,
  },

  professor: {
    hp_weight: 0.8,
    def_weight: 0.7,
    atk_weight: 1.4,
    pen_weight: 1.4,
    dmg_bonus_weight: 1.2,
    dmg_reduction_weight: 1.2,
    utility_weight: 2.2,
  },

  biochemist: {
    hp_weight: 0.7,
    def_weight: 0.5,
    atk_weight: 2.2,
    pen_weight: 2.0,
    dmg_bonus_weight: 2.0,
    dmg_reduction_weight: 0.9,
    utility_weight: 1.2,
  },

  summoner: {
    hp_weight: 0.7,
    def_weight: 0.6,
    atk_weight: 1.8,
    pen_weight: 1.6,
    dmg_bonus_weight: 1.8,
    dmg_reduction_weight: 1.0,
    utility_weight: 1.2,
  },
}

// --- KONSTANTA ENGINE ROOC ---
const PVP_FLAT_CONVERSION = 180
const GENERAL_FLAT_CONVERSION = 50

export const calculatePvPScore = (data: any): number => {
  const job = data.job || 'paladin'
  const weights = JOB_WEIGHTS[job] || JOB_WEIGHTS['paladin']

  // 1. Basic Stat (HP Base / 1000, HP% / 100)
  const hpBase = (data.max_hp || 0) / 1000
  const hpBonus = (data.max_hp_percentage || 0) / 100 // Dibagi 100
  const totalHPValue = hpBase * (1 + hpBonus)

  const patk = (data.patk || 0) / 100
  const matk = (data.matk || 0) / 100
  const pdef = (data.pdef || 0) / 100
  const mdef = (data.mdef || 0) / 100

  // 2. Attack Stat
  const isMagicDps = ['high_wizard', 'professor', 'high_priest', 'summoner'].includes(job)
  const baseMainAtk = isMagicDps ? matk : patk
  const refineAtk = isMagicDps ? data.refine_matk || 0 : data.refine_patk || 0
  const mainAtk = baseMainAtk + refineAtk / GENERAL_FLAT_CONVERSION

  // Ignore PDEF/MDEF (Flat)
  const rawPenetration = isMagicDps ? data.ignore_mdef || 0 : data.ignore_pdef || 0
  const mainPenetration = rawPenetration / GENERAL_FLAT_CONVERSION

  const refineDef = ((data.refine_pdef || 0) + (data.refine_mdef || 0)) / GENERAL_FLAT_CONVERSION
  const totalDef = pdef + mdef + refineDef

  // 3. Damage Reduction
  // Input % langsung dibagi 100
  const pdmgRed = data.pdmg_reduction || 0
  const mdmgRed = data.mdmg_reduction || 0
  const dmgRedDemi = data.dmg_reduction_demi_human || 0
  const dmgRedMed = data.dmg_reduction_medium || 0
  const neutralRed = data.neutral_dmg_reduction || 0
  const critDmgRed = data.critical_damage_reduction || 0

  // Flat PvP Reduction
  const flatPvPRed = (data.pvp_dmg_reduction || 0) / PVP_FLAT_CONVERSION

  const totalDmgReduction =
    pdmgRed + mdmgRed + dmgRedDemi + dmgRedMed + neutralRed + critDmgRed + flatPvPRed

  // 4. Damage Bonus
  const pdmgBonus = (data.pdmg_bonus || 0) / GENERAL_FLAT_CONVERSION
  const mdmgBonus = (data.mdmg_bonus || 0) / GENERAL_FLAT_CONVERSION
  const flatPvPBonus = (data.pvp_dmg_bonus || 0) / PVP_FLAT_CONVERSION

  const dmgVsDemi = data.dmg_vs_demi_human || 0
  const dmgVsMed = data.dmg_vs_medium || 0
  const neutralBonus = data.neutral_dmg_bonus || 0

  const totalDmgBonus =
    (isMagicDps ? mdmgBonus : pdmgBonus) + flatPvPBonus + dmgVsDemi + dmgVsMed + neutralBonus

  // 5. Utility Score
  const utilityScore =
    (data.healing_done || 0) +
    (data.healing_taken || 0) +
    (data.critical_reduction || 0) * 0.1 +
    (data.variable_cast || 0) * 0.5 +
    (data.aspd || 0) * 0.1

  // 6. Final Score
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
