import { redirect } from 'next/navigation'
import { DashboardShell } from '../components/DashboardShell'
import { Suspense } from 'react'
import DashboardLoading from './loading'
import { getSessionUser } from '@/lib/auth'
import { db } from '@/db'
import { guilds } from '@/db/schema'
import { eq } from 'drizzle-orm'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  if (!user) {
    redirect('/login?reason=session_expired')
  }

  let currentGuild = null
  try {
    currentGuild =
      (await db.query.guilds.findFirst({
        where: eq(guilds.guild_master_id, user.id),
      })) || null
  } catch (error: unknown) {
    console.error('Failed to query current guild in DashboardLayout:', error)
  }

  return (
    <DashboardShell guild={currentGuild}>
      <Suspense fallback={<DashboardLoading />}>{children}</Suspense>
    </DashboardShell>
  )
}
