import { db } from '@/db'
import { users, guilds, characters } from '@/db/schema'
import { describe, it, expect } from 'vitest'

describe('Database Schema & Drizzle Client', () => {
  it('initializes db connection and tables properly', () => {
    expect(db).toBeDefined()
    expect(users).toBeDefined()
    expect(guilds).toBeDefined()
    expect(characters).toBeDefined()
  })
})
