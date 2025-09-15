'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import type { Profile } from '@rally-strings/types'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  // For demo purposes, create a mock profile instead of querying the database
  const profile = user ? {
    id: user.id,
    full_name: user.email?.split('@')[0] || 'Demo User',
    role: 'player', // Default role for demo
    email: user.email,
    created_at: new Date().toISOString(),
  } : null
  const profileLoading = false

  return {
    user,
    profile,
    isLoading: loading || (profileLoading && !!user),
    isAuthenticated: !!user,
  }
}
