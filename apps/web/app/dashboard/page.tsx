import { createServerClient } from '@/lib/supabase'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { redirect } from 'next/navigation'

export default async function Dashboard() {
  const supabase = createServerClient()
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/auth/signin')
  }

  return <DashboardPage />
}
