import { eq } from 'drizzle-orm'
import { db } from '@/db'
import {
  guilds,
  characters,
  resources,
  resourceDistributions,
  partySetups,
} from '@/db/schema'
import { getSessionUser, type SessionUser } from './auth'

/**
 * Thrown by the guards below. Callers catch it the same way they already catch
 * any other Error in their existing try/catch blocks — no new control flow needed.
 */
export class UnauthorizedError extends Error {
  code: string
  constructor(
    message = 'Sesi login Anda telah berakhir atau token JWT tidak valid. Silakan login kembali.',
    code = 'UNAUTHORIZED',
  ) {
    super(message)
    this.name = 'UnauthorizedError'
    this.code = code
  }
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) {
    throw new UnauthorizedError(
      'Sesi login Anda telah berakhir atau token JWT tidak valid. Silakan login kembali.',
      'UNAUTHORIZED',
    )
  }
  return user
}

/**
 * Only the guild's own guild_master (or a super_admin) may proceed.
 * This is the single source of truth for "does this user own this guild" —
 * every mutation scoped by guild_id should go through this instead of
 * re-implementing the role/ownership check inline.
 */
export async function requireGuildOwner(guildId: string): Promise<SessionUser> {
  const user = await requireSessionUser()
  if (user.role === 'super_admin') return user

  const guild = await db.query.guilds.findFirst({ where: eq(guilds.id, guildId) })
  if (!guild || guild.guild_master_id !== user.id) {
    throw new UnauthorizedError('Anda tidak memiliki akses ke guild ini')
  }
  return user
}

/** Resolve a character's guild first, then apply the same ownership check. */
export async function requireCharacterGuildOwner(characterId: string) {
  const character = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
  })
  if (!character) throw new UnauthorizedError('Karakter tidak ditemukan')
  const user = await requireGuildOwner(character.guild_id)
  return { user, character }
}

export async function requireResourceGuildOwner(resourceId: string) {
  const resource = await db.query.resources.findFirst({
    where: eq(resources.id, resourceId),
  })
  if (!resource) throw new UnauthorizedError('Resource tidak ditemukan')
  const user = await requireGuildOwner(resource.guild_id)
  return { user, resource }
}

export async function requireDistributionGuildOwner(distributionId: string) {
  const distribution = await db.query.resourceDistributions.findFirst({
    where: eq(resourceDistributions.id, distributionId),
  })
  if (!distribution) throw new UnauthorizedError('Distribusi tidak ditemukan')
  const user = await requireGuildOwner(distribution.guild_id)
  return { user, distribution }
}

export async function requirePartySetupGuildOwner(setupId: string) {
  const setup = await db.query.partySetups.findFirst({
    where: eq(partySetups.id, setupId),
  })
  if (!setup) throw new UnauthorizedError('Party setup tidak ditemukan')
  const user = await requireGuildOwner(setup.guild_id)
  return { user, setup }
}
