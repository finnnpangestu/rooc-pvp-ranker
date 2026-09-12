import 'dotenv/config'
import postgres from 'postgres'
import { calculatePvPScore } from '../utils/calculatePvPScore'
import type { CharacterStatsInput } from '../types'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL is not set in environment.')
  process.exit(1)
}

const sql = postgres(connectionString)

const TARGET_GUILD_ID = process.argv[2] || '6a39236f-214d-43e4-b450-140899a306f5'

const JOBS = [
  'paladin',
  'lord_knight',
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
] as const

const PREFIXES = [
  'Aura', 'Shadow', 'Frost', 'Iron', 'Holy', 'Dark', 'Crimson', 'Storm',
  'Silent', 'Nova', 'Viper', 'Ghost', 'Zenith', 'Phantom', 'Blaze', 'Mystic',
  'Grand', 'Apex', 'Thunder', 'Solar', 'Echo', 'Chaos', 'Rune', 'Steel',
  'Swift', 'Fierce', 'Noble', 'Titan', 'Zephyr', 'Raptor', 'Valkyrie', 'Arch',
  'Zero', 'Wild', 'Lunar', 'Silver', 'Golden', 'Prime', 'Inferno', 'Cosmo'
]

const SUFFIXES = [
  'Blade', 'Knight', 'Priest', 'Hunter', 'Cross', 'Fist', 'Wizard', 'Sage',
  'Smith', 'Alch', 'Cat', 'Rebel', 'Novice', 'Guard', 'Striker', 'Sniper',
  'Bard', 'Dancer', 'Rogue', 'Slayer', 'Walker', 'Breaker', 'Seeker', 'Heart',
  'Fang', 'Claw', 'Shield', 'Song', 'Chord', 'Spark', 'Flare', 'Bane',
  'Vanguard', 'Warden', 'Specter', 'Wraith', 'Champion', 'Master', 'Lord', 'King'
]

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateRandomStats(job: string, index: number): CharacterStatsInput & { name: string; job: string } {
  const name = `${PREFIXES[index % PREFIXES.length]}${SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)]}_${randomBetween(10, 99)}`
  
  const isTank = ['paladin', 'lord_knight'].includes(job)
  const isMagic = ['high_wizard', 'professor', 'biochemist', 'high_priest', 'summoner'].includes(job)
  const isPhysical = !isMagic

  const max_hp = isTank ? randomBetween(1200000, 1800000) : randomBetween(600000, 1100000)
  const patk = isPhysical ? randomBetween(9000, 16000) : randomBetween(1000, 3000)
  const matk = isMagic ? randomBetween(9000, 16000) : randomBetween(1000, 3000)
  const pdef = isTank ? randomBetween(3500, 5500) : randomBetween(1800, 3200)
  const mdef = isTank ? randomBetween(3500, 5500) : randomBetween(1800, 3200)

  const refine_patk = isPhysical ? randomBetween(800, 2000) : randomBetween(100, 400)
  const refine_matk = isMagic ? randomBetween(800, 2000) : randomBetween(100, 400)
  const refine_pdef = isTank ? randomBetween(500, 1200) : randomBetween(200, 600)
  const refine_mdef = isTank ? randomBetween(500, 1200) : randomBetween(200, 600)

  const ignore_pdef = isPhysical ? randomBetween(400, 1200) : 0
  const ignore_mdef = isMagic ? randomBetween(400, 1200) : 0

  const pdmg_reduction = isTank ? randomBetween(40, 75) : randomBetween(20, 50)
  const mdmg_reduction = isTank ? randomBetween(40, 75) : randomBetween(20, 50)
  const dmg_reduction_demi_human = isTank ? randomBetween(30, 60) : randomBetween(15, 40)
  const dmg_reduction_medium = isTank ? randomBetween(20, 45) : randomBetween(10, 30)
  const neutral_dmg_reduction = randomBetween(10, 35)
  const critical_damage_reduction = randomBetween(20, 60)
  const pvp_dmg_reduction = isTank ? randomBetween(400, 900) : randomBetween(200, 600)

  const pdmg_bonus = isPhysical ? randomBetween(400, 1200) : 0
  const mdmg_bonus = isMagic ? randomBetween(400, 1200) : 0
  const pvp_dmg_bonus = randomBetween(300, 800)
  const dmg_vs_demi_human = randomBetween(20, 55)
  const dmg_vs_medium = randomBetween(15, 40)
  const neutral_dmg_bonus = randomBetween(10, 30)

  const fire_dmg_bonus = randomBetween(0, 30)
  const water_dmg_bonus = randomBetween(0, 30)
  const wind_dmg_bonus = randomBetween(0, 30)
  const earth_dmg_bonus = randomBetween(0, 30)
  const ghost_dmg_bonus = randomBetween(0, 30)
  const holy_dmg_bonus = randomBetween(0, 30)
  const poison_dmg_bonus = randomBetween(0, 30)

  const fire_dmg_reduction = randomBetween(5, 25)
  const water_dmg_reduction = randomBetween(5, 25)
  const wind_dmg_reduction = randomBetween(5, 25)
  const earth_dmg_reduction = randomBetween(5, 25)
  const ghost_dmg_reduction = randomBetween(5, 25)
  const holy_dmg_reduction = randomBetween(5, 25)
  const poison_dmg_reduction = randomBetween(5, 25)

  const healing_done = ['high_priest', 'champion', 'paladin'].includes(job) ? randomBetween(30, 80) : 0
  const healing_taken = randomBetween(10, 40)
  const aspd = randomBetween(150, 400)
  const variable_cast = isMagic ? randomBetween(30, 80) : 0
  const critical_reduction = randomBetween(20, 60)

  return {
    name,
    job,
    max_hp,
    patk,
    matk,
    pdef,
    mdef,
    refine_patk,
    refine_matk,
    refine_pdef,
    refine_mdef,
    hit: randomBetween(400, 800),
    flee: randomBetween(300, 700),
    aspd,
    mspd: randomBetween(100, 130),
    variable_cast,
    fixed_cast: 0,
    healing_done,
    healing_taken,
    critical: randomBetween(20, 100),
    critical_damage: randomBetween(50, 150),
    critical_reduction,
    critical_damage_reduction,
    pdmg: randomBetween(10, 50),
    mdmg: randomBetween(10, 50),
    pdmg_reduction,
    mdmg_reduction,
    ignore_pdef,
    ignore_mdef,
    pdmg_bonus,
    mdmg_bonus,
    pvp_dmg_bonus,
    pvp_dmg_reduction,
    max_hp_percentage: randomBetween(10, 40),
    equipment_patk_percentage: isPhysical ? randomBetween(10, 35) : 0,
    equipment_matk_percentage: isMagic ? randomBetween(10, 35) : 0,
    equipment_pdef_percentage: randomBetween(10, 30),
    equipment_mdef_percentage: randomBetween(10, 30),
    dmg_vs_demi_human,
    dmg_reduction_demi_human,
    dmg_vs_medium,
    dmg_reduction_medium,
    neutral_dmg_bonus,
    neutral_dmg_reduction,
    fire_dmg_bonus,
    fire_dmg_reduction,
    water_dmg_bonus,
    water_dmg_reduction,
    wind_dmg_bonus,
    wind_dmg_reduction,
    earth_dmg_bonus,
    earth_dmg_reduction,
    ghost_dmg_bonus,
    ghost_dmg_reduction,
    holy_dmg_bonus,
    holy_dmg_reduction,
    poison_dmg_bonus,
    poison_dmg_reduction,
  }
}

async function run() {
  try {
    console.log(`Checking target guild: ${TARGET_GUILD_ID}...`)

    // 1. Cek guild target, jika tidak ada cari guild yang ada
    let guild = await sql`SELECT id, name FROM guilds WHERE id = ${TARGET_GUILD_ID} LIMIT 1`
    
    if (guild.length === 0) {
      console.warn(`Guild with ID ${TARGET_GUILD_ID} not found. Checking available guilds...`)
      const anyGuild = await sql`SELECT id, name FROM guilds LIMIT 1`
      if (anyGuild.length > 0) {
        console.log(`Found guild: "${anyGuild[0].name}" (${anyGuild[0].id}). Using this guild!`)
        guild = anyGuild
      } else {
        // Buat guild tester jika benar-benar kosong
        const defaultGm = await sql`SELECT id FROM users LIMIT 1`
        const gmId = defaultGm.length > 0 ? defaultGm[0].id : crypto.randomUUID()
        console.log(`No guilds in database. Creating guild "${TARGET_GUILD_ID}" (Tester Guild)...`)
        await sql`
          INSERT INTO guilds (id, name, guild_master_id, total_characters, total_pvp_score, gl_wins, gl_losses, created_at, updated_at)
          VALUES (${TARGET_GUILD_ID}, 'Tester Guild', ${gmId}, 0, 0, 0, 0, NOW(), NOW())
        `
        guild = [{ id: TARGET_GUILD_ID, name: 'Tester Guild' }]
      }
    }

    const guildId = guild[0].id
    const guildName = guild[0].name
    console.log(`\nGenerating 40 characters for Guild "${guildName}" (${guildId})...`)

    let totalScore = 0
    const insertedChars: Array<{ name: string; job: string; pvp_score: number }> = []

    for (let i = 0; i < 40; i++) {
      const job = JOBS[i % JOBS.length]
      const stats = generateRandomStats(job, i)
      const pvpScore = calculatePvPScore(stats)
      totalScore += pvpScore

      const charId = crypto.randomUUID()

      await sql`
        INSERT INTO characters (
          id, name, job, guild_id, is_verified,
          max_hp, patk, matk, pdef, mdef,
          refine_patk, refine_matk, refine_pdef, refine_mdef,
          hit, flee, aspd, mspd, variable_cast, fixed_cast,
          healing_done, healing_taken, critical, critical_damage,
          critical_reduction, critical_damage_reduction,
          pdmg, mdmg, pdmg_reduction, mdmg_reduction,
          ignore_pdef, ignore_mdef, pdmg_bonus, mdmg_bonus,
          pvp_dmg_bonus, pvp_dmg_reduction,
          max_hp_percentage, equipment_patk_percentage, equipment_matk_percentage,
          equipment_pdef_percentage, equipment_mdef_percentage,
          dmg_vs_demi_human, dmg_reduction_demi_human, dmg_vs_medium, dmg_reduction_medium,
          neutral_dmg_bonus, neutral_dmg_reduction,
          fire_dmg_bonus, fire_dmg_reduction, water_dmg_bonus, water_dmg_reduction,
          wind_dmg_bonus, wind_dmg_reduction, earth_dmg_bonus, earth_dmg_reduction,
          ghost_dmg_bonus, ghost_dmg_reduction, holy_dmg_bonus, holy_dmg_reduction,
          poison_dmg_bonus, poison_dmg_reduction,
          pvp_score, gl_total_score, gl_reports,
          woe_present_count, woe_absent_count, gl_present_count, gl_absent_count, total_resources,
          created_at, updated_at
        ) VALUES (
          ${charId}, ${stats.name}, ${stats.job}, ${guildId}, true,
          ${stats.max_hp}, ${stats.patk}, ${stats.matk}, ${stats.pdef}, ${stats.mdef},
          ${stats.refine_patk}, ${stats.refine_matk}, ${stats.refine_pdef}, ${stats.refine_mdef},
          ${stats.hit}, ${stats.flee}, ${stats.aspd}, ${stats.mspd}, ${stats.variable_cast}, ${stats.fixed_cast},
          ${stats.healing_done}, ${stats.healing_taken}, ${stats.critical}, ${stats.critical_damage},
          ${stats.critical_reduction}, ${stats.critical_damage_reduction},
          ${stats.pdmg}, ${stats.mdmg}, ${stats.pdmg_reduction}, ${stats.mdmg_reduction},
          ${stats.ignore_pdef}, ${stats.ignore_mdef}, ${stats.pdmg_bonus}, ${stats.mdmg_bonus},
          ${stats.pvp_dmg_bonus}, ${stats.pvp_dmg_reduction},
          ${stats.max_hp_percentage}, ${stats.equipment_patk_percentage}, ${stats.equipment_matk_percentage},
          ${stats.equipment_pdef_percentage}, ${stats.equipment_mdef_percentage},
          ${stats.dmg_vs_demi_human}, ${stats.dmg_reduction_demi_human}, ${stats.dmg_vs_medium}, ${stats.dmg_reduction_medium},
          ${stats.neutral_dmg_bonus}, ${stats.neutral_dmg_reduction},
          ${stats.fire_dmg_bonus}, ${stats.fire_dmg_reduction}, ${stats.water_dmg_bonus}, ${stats.water_dmg_reduction},
          ${stats.wind_dmg_bonus}, ${stats.wind_dmg_reduction}, ${stats.earth_dmg_bonus}, ${stats.earth_dmg_reduction},
          ${stats.ghost_dmg_bonus}, ${stats.ghost_dmg_reduction}, ${stats.holy_dmg_bonus}, ${stats.holy_dmg_reduction},
          ${stats.poison_dmg_bonus}, ${stats.poison_dmg_reduction},
          ${pvpScore}, 0, '[]',
          0, 0, 0, 0, 0,
          NOW(), NOW()
        )
      `

      insertedChars.push({ name: stats.name, job: stats.job, pvp_score: pvpScore })
    }

    // Update aggregate data di guild
    const countRes = await sql`SELECT COUNT(*)::int as count, COALESCE(SUM(pvp_score::numeric), 0) as total FROM characters WHERE guild_id = ${guildId}`
    const charCount = countRes[0].count
    const totalGuildPvp = countRes[0].total

    await sql`
      UPDATE guilds
      SET total_characters = ${charCount},
          total_pvp_score = ${totalGuildPvp},
          updated_at = NOW()
      WHERE id = ${guildId}
    `

    console.log(`\nSuccessfully created 40 characters for guild "${guildName}"!`)
    console.log(`Total Characters in Guild: ${charCount}`)
    console.log(`Total PvP Score Guild: ${Number(totalGuildPvp).toLocaleString()}`)
    console.log('\nSample Characters Created:')
    console.table(insertedChars.slice(0, 10))

  } catch (err) {
    console.error('Error generating characters:', err)
  } finally {
    await sql.end()
  }
}

run()
