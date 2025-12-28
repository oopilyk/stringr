import { createServerClient } from '@/lib/supabase-server'
import { DiscoverPage } from '@/components/discover/discover-page'

export default async function HomePage() {
  const supabase = createServerClient()

  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession()

  // Allow both authenticated and unauthenticated users
  // Pass authentication status to the discover page
  return <DiscoverPage isAuthenticated={!!session} />
}
