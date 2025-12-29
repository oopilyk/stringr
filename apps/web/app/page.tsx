import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'

export default async function HomePage() {
  const supabase = createServerClient()

  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession()

  // Redirect based on authentication status
  if (session) {
    // Authenticated users go to discover
    redirect('/discover')
  } else {
    // Unauthenticated users see the landing page
    redirect('/auth/signin')
  }
}
