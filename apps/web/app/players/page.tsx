import { createServerClient } from '@/lib/supabase-server'
import { PlayersPage } from '@/components/players/players-page'

export default async function PlayersRoute() {
  const supabase = createServerClient()

  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession()

  return <PlayersPage isAuthenticated={!!session} />
}
