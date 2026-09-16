import { LeaderboardClient } from './LeaderboardClient'
import { getGuilds } from '@/actions/leaderboards/getGuilds'

export const metadata = {
  title: 'Leaderboard | ROOC PvP Ranker',
  description: 'Lihat peringkat PvP antar guild.',
}

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
  const guildsRes = await getGuilds()

  return <LeaderboardClient allGuilds={guildsRes} />
}
