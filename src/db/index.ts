import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined
}

const connectionString = process.env.DATABASE_URL || ''

// Connection pooling for serverless / Next.js
const conn =
  globalForDb.conn ??
  postgres(connectionString, {
    prepare: false,
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  })

if (process.env.NODE_ENV !== 'production') globalForDb.conn = conn

export const db = drizzle(conn, { schema })
export type DbClient = typeof db
