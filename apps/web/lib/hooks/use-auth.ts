'use client'

import { useUser, useSessionContext } from '@supabase/auth-helpers-react'
import { useQuery } from '@tanstack/react-query'
import type { Profile } from '@rally-strings/types'

export function useAuth() {
  const user = useUser()
  const { supabaseClient } = useSessionContext()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      return data as Profile
    },
    enabled: !!user?.id,
  })

  return {
    user,
    profile,
    isLoading: isLoading && !!user,
    isAuthenticated: !!user,
  }
}
