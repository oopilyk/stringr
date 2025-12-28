import { createServerClient } from '@/lib/supabase-server'
import { DiscoverPage } from '@/components/discover/discover-page'

export default async function DiscoverRoute() {
  const supabase = createServerClient()

  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession()

  // Allow both authenticated and unauthenticated users
  return <DiscoverPage isAuthenticated={!!session} />
}
