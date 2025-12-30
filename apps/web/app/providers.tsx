'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createBrowserClient } from '@supabase/ssr'
import { useState } from 'react'
import { SearchLocationProvider } from '@/lib/contexts/search-location-context'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <SearchLocationProvider>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </SearchLocationProvider>
    </QueryClientProvider>
  )
}
