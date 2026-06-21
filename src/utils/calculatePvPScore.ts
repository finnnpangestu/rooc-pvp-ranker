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
  //  TANKERS
  paladin: {
    hp_weight: 2.0,
    def_weight: 1.5,
    atk_weight: 0.5,
    pen_weight: 0.2,
    dmg_bonus_weight: 0.5,
    dmg_reduction_weight: 2.0,
    utility_weight: 0.5,
  },
  lord_knight: {
    hp_weight: 1.5,
    def_weight: 1.2,
    atk_weight: 1.2,
    pen_weight: 0.8,
    dmg_bonus_weight: 1.0,
    dmg_reduction_weight: 1.5,
    utility_weight: 0.5,
  },

  //  SUPPORTS
  high_priest: {
    hp_weight: 1.5,
    def_weight: 1.5,
    atk_weight: 0.2,
    pen_weight: 0.0,
    dmg_bonus_weight: 0.0,
    dmg_reduction_weight: 2.0,
    utility_weight: 2.0,
  },
  minstrell: {
    hp_weight: 1.2,
    def_weight: 1.2,
    atk_weight: 0.8,
    pen_weight: 0.5,
    dmg_bonus_weight: 0.5,
    dmg_reduction_weight: 1.8,
    utility_weight: 1.8,
  },
  gypsy: {
    hp_weight: 1.2,
    def_weight: 1.2,
    atk_weight: 0.8,
    pen_weight: 0.5,
    dmg_bonus_weight: 0.5,
    dmg_reduction_weight: 1.8,
    utility_weight: 1.8,
  },

  //  PHYSICAL DPS
  assassin_cross: {
    hp_weight: 0.8,
    def_weight: 0.5,
    atk_weight: 1.8,
    pen_weight: 2.0,
    dmg_bonus_weight: 1.8,
    dmg_reduction_weight: 0.8,
    utility_weight: 1.2,
  },
  sniper: {
    hp_weight: 0.5,
    def_weight: 0.5,
    atk_weight: 1.8,
    pen_weight: 1.8,
    dmg_bonus_weight: 1.5,
    dmg_reduction_weight: 0.5,
    utility_weight: 1.5,
  },
  champion: {
    hp_weight: 1.0,
    def_weight: 0.8,
    atk_weight: 2.0,
    pen_weight: 1.8,
    dmg_bonus_weight: 1.5,
    dmg_reduction_weight: 1.0,
    utility_weight: 0.5,
  },
  mastersmith: {
    hp_weight: 1.2,
    def_weight: 1.0,
    atk_weight: 1.5,
    pen_weight: 1.5,
    dmg_bonus_weight: 1.2,
    dmg_reduction_weight: 1.0,
    utility_weight: 0.8,
  },
  stalker: {
    hp_weight: 1.0,
    def_weight: 0.8,
    atk_weight: 1.5,
    pen_weight: 1.5,
    dmg_bonus_weight: 1.5,
    dmg_reduction_weight: 1.2,
    utility_weight: 1.0,
  },

  //  MAGICAL DPS
  high_wizard: {
    hp_weight: 0.5,
    def_weight: 0.5,
    atk_weight: 2.0,
    pen_weight: 1.8,
    dmg_bonus_weight: 1.8,
    dmg_reduction_weight: 0.8,
    utility_weight: 1.5,
  },
  professor: {
    hp_weight: 1.0,
    def_weight: 1.0,
    atk_weight: 1.5,
    pen_weight: 1.5,
    dmg_bonus_weight: 1.2,
    dmg_reduction_weight: 1.5,
    utility_weight: 1.8,
  },
  biochemist: {
    hp_weight: 1.0,
    def_weight: 0.8,
    atk_weight: 1.8,
    pen_weight: 1.8,
    dmg_bonus_weight: 1.5,
    dmg_reduction_weight: 1.0,
    utility_weight: 1.2,
  },
  summoner: {
    hp_weight: 1.2,
    def_weight: 1.0,
    atk_weight: 1.5,
    pen_weight: 1.2,
    dmg_bonus_weight: 1.5,
    dmg_reduction_weight: 1.2,
    utility_weight: 1.0,
  },
}

export const calculatePvPScore = (data: any): number => {
  const job = data.job || 'paladin' // Fallback
  const weights = JOB_WEIGHTS[job] || JOB_WEIGHTS['paladin']

  // 1. STAT DASAR
  const hpBase = (data.max_hp || 0) / 1000
  const hpBonus = data.max_hp_percentage || 0
  const totalHPValue = hpBase * (1 + hpBonus)

  const patk = (data.patk || 0) / 100
  const matk = (data.matk || 0) / 100
  const pdef = (data.pdef || 0) / 100
  const mdef = (data.mdef || 0) / 100

  // 2. KLASIFIKASI STAT
  const isMagicDps = ['high_wizard', 'professor', 'high_priest', 'summoner'].includes(job)
  const mainAtk = isMagicDps ? matk : patk
  const mainPenetration = isMagicDps ? data.ignore_mdef || 0 : data.ignore_pdef || 0

  const totalDef = pdef + mdef

  // Damage Reduction (Fokus PvP)
  const totalDmgReduction =
    (data.dmg_reduction_demi_human || 0) * 100 +
    (data.dmg_reduction_medium || 0) * 100 +
    (data.pvp_dmg_reduction || 0) * 100 +
    (data.neutral_dmg_reduction || 0) * 100

  // Damage Bonus (Fokus PvP)
  const totalDmgBonus =
    (data.dmg_vs_demi_human || 0) * 100 +
    (data.dmg_vs_medium || 0) * 100 +
    (data.pvp_dmg_bonus || 0) * 100

  // Utility (Healing, Cast Time, ASPD)
  const utilityScore =
    (data.healing_done || 0) * 100 + (data.variable_cast || 0) * 50 + (data.aspd || 0) * 10

  // 3. KALKULASI AKHIR
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
