import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options)
          },
          remove(name: string, options: any) {
            cookieStore.delete(name)
          },
        },
      }
    )

    await supabase.auth.exchangeCodeForSession(code)
  }

  // SECURITY: Whitelist allowed redirect origins to prevent open redirect attacks
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
    'http://localhost:3001',
  ].filter(Boolean) as string[]

  // Check if the request origin is in the whitelist
  if (allowedOrigins.includes(requestUrl.origin)) {
    return NextResponse.redirect(`${requestUrl.origin}/discover`)
  }

  // Fallback to env variable or localhost
  const fallbackUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return NextResponse.redirect(`${fallbackUrl}/discover`)
}
