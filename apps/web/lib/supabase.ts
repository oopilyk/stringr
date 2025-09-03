
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Only export client-side Supabase client for use in /pages
export const createClient = () => {
  return createClientComponentClient()
}

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// If you need server-side Supabase client for /app directory, create a separate file (e.g., supabase.server.ts) and import next/headers there.
