import { redirect } from 'next/navigation'

export default async function HomePage() {
  // Always redirect to the landing page
  redirect('/auth/signin')
}
