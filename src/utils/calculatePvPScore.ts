import type { CharacterStatsInput } from '@/types'

export interface Job6Weights {
  atk_weight: number
  def_weight: number
  crit_weight: number
  agi_weight: number
  cast_weight: number
  utl_weight: number
}

export interface HexagonStats {
  atk: number
  def: number
  crit: number
  agi: number
  cast: number
  utl: number
}

/**
 * 6-Pilar Standarisasi Bobot Job (Total Budget 10.0 Poin per Job)
 * 1. DEF (Survivability): HP, PDEF, MDEF, Refine DEF, All Reductions (Demi, Med, Elemental, PvP)
 * 2. ATK (Offense): PATK, MATK, Refine ATK, Penetration (Ignore DEF/MDEF), All Dmg Bonuses
 * 3. CRIT (Lethality): Critical Rate, Critical Damage, Critical Resilience (Crit Red & Crit Dmg Red)
 * 4. AGI (Mobility & Speed): Movement Speed (MSPD), Attack Speed (ASPD), Flee, Hit
 * 5. CAST (Cadence & Execution): Variable Cast Time Reduction, Fixed Cast Time Reduction
 * 6. UTL (Support & Sustain): Healing Done, Healing Taken, Support Resilience
 */
export const JOB_WEIGHTS: Record<string, Job6Weights> = {
  // 1. Tank / Frontline Guardian & Devotion Anchor (Sum = 10.0)
  paladin: {
    def_weight: 3.5,
    utl_weight: 2.1,
    agi_weight: 1.6,
    atk_weight: 1.4,
    cast_weight: 1.0,
    crit_weight: 0.4,
  },

  // 2. Frontline Bruiser & Clashing Spiral Striker (Sum = 10.0)
  lord_knight: {
    def_weight: 2.5,
    atk_weight: 2.6,
    agi_weight: 2.0,
    crit_weight: 1.4,
    cast_weight: 0.8,
    utl_weight: 0.7,
  },

  // 3. Core Support, Healer & Resurrector (Sum = 10.0)
  high_priest: {
    utl_weight: 3.2,
    def_weight: 2.6,
    cast_weight: 2.4,
    agi_weight: 0.8,
    atk_weight: 0.6,
    crit_weight: 0.4,
  },

  // 4. Single-Target Executioner & Asura Finisher (Sum = 10.0)
  champion: {
    atk_weight: 3.2,
    crit_weight: 2.0,
    def_weight: 1.6,
    agi_weight: 1.6,
    cast_weight: 1.0,
    utl_weight: 0.6,
  },

  // 5. Stealth Melee Burst Assassin (Sum = 10.0)
  assassin_cross: {
    atk_weight: 3.2,
    crit_weight: 2.6,
    agi_weight: 2.4,
    def_weight: 1.0,
    cast_weight: 0.4,
    utl_weight: 0.4,
  },

  // 6. Tactical Stripper, Disrupter & CC (Sum = 10.0)
  stalker: {
    agi_weight: 2.4,
    atk_weight: 2.2,
    def_weight: 1.8,
    utl_weight: 1.6,
    cast_weight: 1.2,
    crit_weight: 0.8,
  },

  // 7. Large-Scale AoE Magic Artillery (Sum = 10.0)
  high_wizard: {
    atk_weight: 3.2,
    cast_weight: 2.8,
    def_weight: 1.4,
    utl_weight: 1.2,
    agi_weight: 1.0,
    crit_weight: 0.4,
  },

  // 8. Anti-Meta Dispel, Web, Land Protector (Sum = 10.0)
  professor: {
    cast_weight: 2.5,
    def_weight: 2.1,
    utl_weight: 2.0,
    atk_weight: 1.8,
    agi_weight: 1.2,
    crit_weight: 0.4,
  },

  // 9. Long-Range Sustained Physical Sniper (Sum = 10.0)
  sniper: {
    atk_weight: 3.0,
    crit_weight: 2.6,
    agi_weight: 2.4,
    def_weight: 1.0,
    cast_weight: 0.6,
    utl_weight: 0.4,
  },

  // 10. Offensive Buffer & CC Disrupter (Sum = 10.0)
  minstrell: {
    utl_weight: 2.8,
    def_weight: 2.2,
    cast_weight: 2.4,
    agi_weight: 1.4,
    atk_weight: 0.8,
    crit_weight: 0.4,
  },

  // 11. Defensive Buffer & Crowd Controller (Sum = 10.0)
  gypsy: {
    utl_weight: 2.8,
    def_weight: 2.2,
    cast_weight: 2.4,
    agi_weight: 1.4,
    atk_weight: 0.8,
    crit_weight: 0.4,
  },

  // 12. Cart Brawler & Gear Breaker (Sum = 10.0)
  mastersmith: {
    atk_weight: 2.8,
    def_weight: 2.2,
    agi_weight: 2.0,
    crit_weight: 1.6,
    utl_weight: 0.8,
    cast_weight: 0.6,
  },

  // 13. Tank-Buster (Acid Demonstration) & Support (Sum = 10.0)
  biochemist: {
    atk_weight: 2.8,
    def_weight: 2.0,
    cast_weight: 2.2,
    utl_weight: 1.8,
    agi_weight: 0.8,
    crit_weight: 0.4,
  },

  // 14. Doram Hybrid (Magic / Physical / Support) (Sum = 10.0)
  summoner: {
    def_weight: 2.2,
    atk_weight: 2.2,
    utl_weight: 2.0,
    cast_weight: 1.6,
    agi_weight: 1.4,
    crit_weight: 0.6,
  },

  // 15. Adaptable Wildcard Super Novice (Sum = 10.0)
  adept_novice: {
    atk_weight: 2.4,
    def_weight: 2.0,
    agi_weight: 1.8,
    cast_weight: 1.6,
    crit_weight: 1.2,
    utl_weight: 1.0,
  },

  // 16. Heavy Ranged Firearm Artillery (Sum = 10.0)
  rebellion: {
    atk_weight: 3.2,
    agi_weight: 2.2,
    crit_weight: 2.2,
    def_weight: 1.4,
    cast_weight: 0.6,
    utl_weight: 0.4,
  },
}

// --- KONSTANTA ENGINE ROOC ---
const PVP_FLAT_CONVERSION = 180
const GENERAL_FLAT_CONVERSION = 50
const PENETRATION_CONVERSION = 25
const DMG_REDUCTION_SCALE = 1.8

// Benchmark Caps untuk Normalisasi Hexagon Skala 0 - 100
const CAP_ATK = 220
const CAP_DEF = 220
const CAP_CRIT = 140
const CAP_AGI = 140
const CAP_CAST = 110
const CAP_UTL = 130

interface RawPillars {
  rawDefPillar: number
  rawAtkPillar: number
  rawCritPillar: number
  rawAgiPillar: number
  rawCastPillar: number
  rawUtlPillar: number
}

function computeRawPillars(data: CharacterStatsInput): RawPillars {
  const job = (data.job || 'paladin') as string
  const num = (val: unknown): number => (val !== undefined && val !== null ? Number(val) || 0 : 0)

  // 1. DEF Pillar (Survivability)
  // HP + DEF/MDEF + Reductions
  // Rebalanced HP scaling: Mencegah inflasi skor berlebih pada karakter ber-HP tinggi (diminishing returns)
  const hpBonusMultiplier = 1 + num(data.max_hp_percentage) / 100
  const effectiveHP = Math.max(0, num(data.max_hp) * hpBonusMultiplier)
  const totalHPValue = effectiveHP > 0 ? Math.pow(effectiveHP / 1000, 0.58) * 2.1 : 0
  const pdef = num(data.pdef) / 100
  const mdef = num(data.mdef) / 100
  const refineDef = (num(data.refine_pdef) + num(data.refine_mdef)) / GENERAL_FLAT_CONVERSION
  const totalDef = pdef + mdef + refineDef

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

  const rawDmgReduction =
    pdmgRed +
    mdmgRed +
    dmgRedDemi +
    dmgRedMed +
    neutralRed +
    critDmgRed +
    flatPvPRed +
    totalElementalRed

  const totalDmgReduction = rawDmgReduction / DMG_REDUCTION_SCALE
  const rawDefPillar = totalHPValue + totalDef * 0.35 + totalDmgReduction * 0.55

  // 2. ATK Pillar (Offense)
  // PATK/MATK + Refine + Penetration + DMG Bonus
  const patk = num(data.patk) / 100
  const matk = num(data.matk) / 100
  const isMagicDps = ['high_wizard', 'professor', 'high_priest', 'summoner'].includes(job)
  const isNoviceMagic = job === 'adept_novice' && matk > patk
  const effectiveIsMagic = isMagicDps || isNoviceMagic

  let mainAtk: number
  let mainPenetration: number

  if (job === 'biochemist') {
    // Acid Demonstration dual scaling di ROOC
    const hybridBaseAtk = patk * 0.7 + matk * 0.7
    const hybridRefine =
      (num(data.refine_patk) * 0.7 + num(data.refine_matk) * 0.7) / GENERAL_FLAT_CONVERSION
    mainAtk = hybridBaseAtk + hybridRefine
    const rawPenetration = Math.max(num(data.ignore_pdef), num(data.ignore_mdef))
    mainPenetration = rawPenetration / PENETRATION_CONVERSION
  } else {
    const baseMainAtk = effectiveIsMagic ? matk : patk
    const refineAtk = effectiveIsMagic ? num(data.refine_matk) : num(data.refine_patk)
    mainAtk = baseMainAtk + refineAtk / GENERAL_FLAT_CONVERSION
    const rawPenetration = effectiveIsMagic ? num(data.ignore_mdef) : num(data.ignore_pdef)
    mainPenetration = rawPenetration / PENETRATION_CONVERSION
  }

  const pdmgBonus = num(data.pdmg_bonus) / GENERAL_FLAT_CONVERSION
  const mdmgBonus = num(data.mdmg_bonus) / GENERAL_FLAT_CONVERSION
  const flatPvPBonus = num(data.pvp_dmg_bonus) / PVP_FLAT_CONVERSION
  const primaryDmgBonus =
    job === 'biochemist' ? Math.max(pdmgBonus, mdmgBonus) : effectiveIsMagic ? mdmgBonus : pdmgBonus

  const dmgVsDemi = num(data.dmg_vs_demi_human)
  const dmgVsMed = num(data.dmg_vs_medium)
  const neutralBonus = num(data.neutral_dmg_bonus)
  const maxElementalBonus = Math.max(
    num(data.fire_dmg_bonus),
    num(data.water_dmg_bonus),
    num(data.wind_dmg_bonus),
    num(data.earth_dmg_bonus),
    num(data.ghost_dmg_bonus),
    num(data.holy_dmg_bonus),
    num(data.poison_dmg_bonus),
  )

  const totalDmgBonus =
    primaryDmgBonus + flatPvPBonus + dmgVsDemi + dmgVsMed + neutralBonus + maxElementalBonus

  const rawAtkPillar = mainAtk * 0.65 + mainPenetration * 0.8 + totalDmgBonus * 0.55

  // 3. CRIT Pillar (Lethality)
  const rawCritPillar =
    num(data.critical) * 0.4 +
    num(data.critical_damage) * 0.35 +
    num(data.critical_reduction) * 0.15 +
    num(data.critical_damage_reduction) * 0.15

  // 4. AGI Pillar (Mobility & Speed)
  const mspdBonus = num(data.mspd) > 50 ? num(data.mspd) - 100 : num(data.mspd)
  const rawAgiPillar =
    Math.max(0, mspdBonus) * 1.5 +
    num(data.aspd) * 0.12 +
    num(data.flee) * 0.04 +
    num(data.hit) * 0.04

  // 5. CAST Pillar (Cadence & Execution)
  const rawCastPillar = num(data.variable_cast) * 0.8 + num(data.fixed_cast) * 1.2

  // 6. UTL Pillar (Support, Sustain & Team Presence)
  const rawUtlPillar =
    num(data.healing_done) * 0.6 +
    num(data.healing_taken) * 0.4 +
    num(data.critical_reduction) * 0.25 +
    num(data.critical_damage_reduction) * 0.25

  return { rawDefPillar, rawAtkPillar, rawCritPillar, rawAgiPillar, rawCastPillar, rawUtlPillar }
}

/**
 * Menentukan bobot job adaptif berdasarkan variasi build pemain
 * (e.g. Paladin Sacrifice Crit/ASPD, LK Two-Hand Frenzy Crit/ASPD, Sniper/Rebellion Crit, Champion Combo Crit, Super Novice Magic/Physical).
 * Seluruh adaptasi dijamin selalu ternormalisasi tepat 10.0 poin.
 */
export const resolveAdaptiveWeights = (data: CharacterStatsInput): Job6Weights => {
  const job = (data.job || 'paladin') as string
  const base: Job6Weights = { ...(JOB_WEIGHTS[job] || JOB_WEIGHTS['paladin']) }
  const num = (val: unknown): number => (val !== undefined && val !== null ? Number(val) || 0 : 0)

  const crit = num(data.critical)
  const aspd = num(data.aspd)
  const patk = num(data.patk)
  const matk = num(data.matk)

  // 1. Paladin: Deteksi Build Sacrifice (Martyr's Reckoning)
  // Di ROOC, Sacrifice mengorbankan HP, memanfaatkan ASPD dan Crit
  // Tetap mempertahankan DEF tinggi (2.8) karena Sacrifice membutuhkan pool HP dan durabilitas tebal
  if (job === 'paladin') {
    if (crit >= 100 || aspd >= 400) {
      base.crit_weight = 1.2
      base.agi_weight = 1.8
      base.def_weight = 2.8
      base.cast_weight = 0.7
      base.atk_weight = 1.4
      base.utl_weight = 2.1
    }
  }

  // 2. Lord Knight: Deteksi Build ASPD Basic Attack / Two-Hand Quicken & Frenzy Crit
  if (job === 'lord_knight') {
    if (crit >= 100 || aspd >= 400) {
      base.crit_weight = 2.0
      base.agi_weight = 2.4
      base.def_weight = 2.1
      base.cast_weight = 0.4
      base.utl_weight = 0.5
      base.atk_weight = 2.6
    }
  }

  // 3. Sniper: Deteksi Build Sharp Shooting & Heavy Crit Bow
  if (job === 'sniper') {
    if (crit >= 100) {
      base.crit_weight = 2.8
      base.cast_weight = 0.4
    }
  }

  // 4. Rebellion: Deteksi Build Heavy Sniper Rifle / Quick-Draw Crit
  if (job === 'rebellion') {
    if (crit >= 100) {
      base.crit_weight = 2.6
      base.cast_weight = 0.4
      base.def_weight = 1.2
    }
  }

  // 5. Champion: Deteksi Build Combo / Crit Monk vs Asura Strike Nuker
  if (job === 'champion') {
    if (crit >= 100 || aspd >= 400) {
      base.crit_weight = 2.5
      base.agi_weight = 2.0
      base.cast_weight = 0.5
      base.atk_weight = 2.8
    }
  }

  // 6. Adept Novice: Deteksi Magic vs Physical Crit
  if (job === 'adept_novice') {
    if (matk > patk) {
      // Magic Super Novice
      base.cast_weight = 2.2
      base.atk_weight = 2.6
      base.crit_weight = 0.4
      base.def_weight = 2.0
      base.agi_weight = 1.8
      base.utl_weight = 1.0
    } else if (crit >= 100) {
      // Physical Crit Super Novice
      base.crit_weight = 2.0
      base.agi_weight = 2.2
      base.atk_weight = 2.4
      base.def_weight = 1.8
      base.cast_weight = 0.6
      base.utl_weight = 1.0
    }
  }

  // Verifikasi Budget Normalisasi (harus tepat 10.0)
  const sum =
    base.atk_weight +
    base.def_weight +
    base.crit_weight +
    base.agi_weight +
    base.cast_weight +
    base.utl_weight
  const roundedSum = Math.round(sum * 10) / 10

  if (roundedSum !== 10.0) {
    const diff = 10.0 - roundedSum
    base.def_weight = Math.round((base.def_weight + diff) * 10) / 10
  }

  return base
}

/**
 * Menghitung skor PvP total karakter berdasarkan 6 pilar ternormalisasi dan adaptasi build.
 * Kompatibel penuh dengan implementasi server action dan simulator.
 */
export const calculatePvPScore = (data: CharacterStatsInput): number => {
  const w = resolveAdaptiveWeights(data)
  const p = computeRawPillars(data)

  const score =
    p.rawDefPillar * w.def_weight +
    p.rawAtkPillar * w.atk_weight +
    p.rawCritPillar * w.crit_weight +
    p.rawAgiPillar * w.agi_weight +
    p.rawCastPillar * w.cast_weight +
    p.rawUtlPillar * w.utl_weight

  return Math.round(score)
}

/**
 * Menghitung nilai Hexagon Stats (skala 0 - 100 untuk tiap sumbu)
 * Siap dikonsumsi langsung oleh komponen visual radar/heksagon chart.
 */
export const calculateHexagonStats = (data: CharacterStatsInput): HexagonStats => {
  const p = computeRawPillars(data)
  const clamp = (val: number, cap: number) =>
    Math.min(100, Math.max(5, Math.round((val / cap) * 100)))

  return {
    def: clamp(p.rawDefPillar, CAP_DEF),
    atk: clamp(p.rawAtkPillar, CAP_ATK),
    crit: clamp(p.rawCritPillar, CAP_CRIT),
    agi: clamp(p.rawAgiPillar, CAP_AGI),
    cast: clamp(p.rawCastPillar, CAP_CAST),
    utl: clamp(p.rawUtlPillar, CAP_UTL),
  }
}

/**
 * Menghitung skor PvP total sekaligus hexagon stats
 */
export const calculatePvPScoreDetails = (
  data: CharacterStatsInput,
): { score: number; hexagon: HexagonStats } => {
  return {
    score: calculatePvPScore(data),
    hexagon: calculateHexagonStats(data),
  }
}
