import { createServerClient } from '@/lib/supabase'
import { DiscoverPage } from '@/components/discover/discover-page'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = createServerClient()
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/auth/signin')
  }

  return <DiscoverPage />
}
