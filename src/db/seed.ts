import 'dotenv/config'
import postgres from 'postgres'
import bcrypt from 'bcryptjs'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL is not set in environment.')
  process.exit(1)
}

const sql = postgres(connectionString)

async function seed() {
  console.log('Seeding database...')

  try {
    const salt = await bcrypt.genSalt(10)
    const testerHashedPassword = await bcrypt.hash('password123', salt)
    const adminHashedPassword = await bcrypt.hash('admin123', salt)

    const testerId = crypto.randomUUID()
    const adminId = crypto.randomUUID()
    const guildId = crypto.randomUUID()

    // 1. Check or insert Tester User (Guild Master)
    const existingTester = await sql`SELECT id FROM users WHERE email = 'tester@gmail.com'`
    if (existingTester.length === 0) {
      await sql`
        INSERT INTO users (id, name, email, password, role, created_at, updated_at)
        VALUES (${testerId}, 'Tester GM', 'tester@gmail.com', ${testerHashedPassword}, 'guild_master', NOW(), NOW())
      `
      console.log('Created user: tester@gmail.com (password: password123)')
    } else {
      await sql`
        UPDATE users 
        SET password = ${testerHashedPassword}, name = 'Tester GM', role = 'guild_master', updated_at = NOW()
        WHERE email = 'tester@gmail.com'
      `
      console.log('Updated password for existing user: tester@gmail.com (password: password123)')
    }

    // 2. Check or insert Super Admin
    const existingAdmin = await sql`SELECT id FROM users WHERE email = 'adminku@gmail.com'`
    if (existingAdmin.length === 0) {
      await sql`
        INSERT INTO users (id, name, email, password, role, created_at, updated_at)
        VALUES (${adminId}, 'Admin Super', 'adminku@gmail.com', ${adminHashedPassword}, 'super_admin', NOW(), NOW())
      `
      console.log('Created user: adminku@gmail.com (password: admin123)')
    } else {
      await sql`
        UPDATE users 
        SET password = ${adminHashedPassword}, name = 'Admin Super', role = 'super_admin', updated_at = NOW()
        WHERE email = 'adminku@gmail.com'
      `
      console.log('Updated password for existing user: adminku@gmail.com (password: admin123)')
    }

    // 3. Ensure a default Guild exists
    const existingGuild = await sql`SELECT id FROM guilds LIMIT 1`
    if (existingGuild.length === 0) {
      const activeTesterId = existingTester.length > 0 ? existingTester[0].id : testerId
      await sql`
        INSERT INTO guilds (id, name, guild_master_id, total_characters, total_pvp_score, gl_wins, gl_losses, created_at, updated_at)
        VALUES (${guildId}, 'ROOC Elite Guild', ${activeTesterId}, 0, 0, 0, 0, NOW(), NOW())
      `
      console.log('Created default guild: ROOC Elite Guild')
    }

    console.log('Seeding successfully completed!')
  } catch (error) {
    console.error('Error during seeding:', error)
  } finally {
    await sql.end()
  }
}

seed()
