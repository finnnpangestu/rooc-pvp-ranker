import { redirect } from 'next/navigation'
import { getCharactersDashboard } from '@/actions/dashboard/getCharactersDashboard'
import { MemberClient } from './MemberClient'
import { getSessionUser } from '@/lib/auth'
import { db } from '@/db'
import { guilds } from '@/db/schema'
import { eq } from 'drizzle-orm'

import type { Character } from '@/types'

export const metadata = {
  title: 'Daftar Member Guild',
}

export default async function MemberPage() {
  const user = await getSessionUser()
  if (!user) {
    redirect('/login')
  }

  const currentGuild =
    (await db.query.guilds.findFirst({
      where: eq(guilds.guild_master_id, user.id),
    })) || null

  let guildMembers: Character[] = []

  if (currentGuild) {
    guildMembers = await getCharactersDashboard(currentGuild.id)
  }

  return <MemberClient guild={currentGuild} members={guildMembers} />
}
