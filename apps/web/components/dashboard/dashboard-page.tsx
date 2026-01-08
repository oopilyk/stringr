'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/use-auth'
import { Navigation } from '@/components/layout/navigation'
import { StatusBadge, formatPrice, formatTimeRange } from '@stringerly/ui'
import { Button } from '@stringerly/ui'
import { DollarSign, Star, MessageSquare, CheckCircle, Activity, X } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ActiveJobCard } from '@/components/requests/active-job-card'
import { PlayerActiveRequestCard } from '@/components/requests/player-active-request-card'

export function DashboardPage() {
  const { profile, user } = useAuth()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  useEffect(() => {
    if (searchParams.get('request_submitted') === 'true') {
      setShowSuccessMessage(true)
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => setShowSuccessMessage(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  // Check if user is a stringer
  const { data: stringerSettings } = useQuery({
    queryKey: ['stringer-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const { data } = await supabase
        .from('stringer_settings')
        .select('*')
        .eq('id', user.id)
        .single()
      return data
    },
    enabled: !!user?.id,
  })

  const isStringer = !!stringerSettings

  // Mark all pending requests as viewed when dashboard is accessed
  useEffect(() => {
    const markRequestsAsViewed = async () => {
      if (!user?.id || !isStringer) return

      const { error } = await supabase
        .from('requests')
        .update({ viewed_at: new Date().toISOString() })
        .eq('stringer_id', user.id)
        .eq('status', 'pending')
        .is('viewed_at', null)

      if (error) {
        console.error('Error marking requests as viewed:', error)
      } else {
        // Invalidate the pending requests count query to update the badge
        queryClient.invalidateQueries({ queryKey: ['pending-requests-count'] })
      }
    }

    markRequestsAsViewed()
  }, [user?.id, isStringer, supabase, queryClient])

  // Subscribe to real-time updates for requests
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel('dashboard-requests')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'requests',
        filter: isStringer ? `stringer_id=eq.${user.id}` : `player_id=eq.${user.id}`
      }, () => {
        // Invalidate queries to refetch data
        queryClient.invalidateQueries({ queryKey: ['player-requests'] })
        queryClient.invalidateQueries({ queryKey: ['stringer-requests'] })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, isStringer, supabase, queryClient])

  // Fetch player's requests (requests they made)
  const { data: playerRequests = [], isLoading: playerLoading } = useQuery({
    queryKey: ['player-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      // First, get the requests
      const { data: requests, error: requestsError } = await supabase
        .from('requests')
        .select('*')
        .eq('player_id', user.id)
        .order('created_at', { ascending: false })

      if (requestsError) {
        console.error('Player requests error:', requestsError)
        throw requestsError
      }

      if (!requests || requests.length === 0) return []

      // Then, get the stringer profiles for these requests
      const stringerIds = Array.from(new Set(requests.map(r => r.stringer_id)))
      const { data: stringers, error: stringersError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', stringerIds)

      if (stringersError) {
        console.error('Stringers fetch error:', stringersError)
      }

      // Merge the data
      const stringerMap = new Map((stringers || []).map(s => [s.id, s]))
      return requests.map(r => ({
        ...r,
        stringer: stringerMap.get(r.stringer_id)
      }))
    },
    enabled: !!user?.id,
  })

  // Fetch stringer's incoming requests (requests sent to them)
  // Always call this hook to maintain consistent hook order
  const { data: stringerRequests = [], isLoading: stringerLoading } = useQuery({
    queryKey: ['stringer-requests', user?.id],
    queryFn: async () => {
      if (!user?.id || !isStringer) return []

      // First, get the requests
      const { data: requests, error: requestsError } = await supabase
        .from('requests')
        .select('*')
        .eq('stringer_id', user.id)
        .order('created_at', { ascending: false })

      if (requestsError) {
        console.error('Stringer requests error:', requestsError)
        throw requestsError
      }

      if (!requests || requests.length === 0) return []

      // Then, get the player profiles for these requests
      const playerIds = Array.from(new Set(requests.map(r => r.player_id)))
      const { data: players, error: playersError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', playerIds)

      if (playersError) {
        console.error('Players fetch error:', playersError)
      }

      // Merge the data
      const playerMap = new Map((players || []).map(p => [p.id, p]))
      return requests.map(r => ({
        ...r,
        player: playerMap.get(r.player_id)
      }))
    },
    enabled: !!user?.id && isStringer,
  })

  if (!profile) {
    return <div>Loading...</div>
  }

  const requests = playerRequests
  const isLoading = playerLoading

  const activeRequests = requests.filter(r =>
    ['pending', 'accepted', 'in_progress', 'ready_for_pickup'].includes(r.status)
  )
  const completedRequests = requests.filter(r => r.status === 'completed')

  const pendingStringerRequests = stringerRequests.filter(r => r.status === 'pending')
  const activeStringerRequests = stringerRequests.filter(r =>
    ['accepted', 'in_progress', 'ready_for_pickup'].includes(r.status)
  )
  const completedStringerRequests = stringerRequests.filter(r => r.status === 'completed')

  // Calculate stringer earnings
  const totalEarnings = completedStringerRequests.reduce((sum, r) => {
    const jobPrice = r.final_price_cents || r.estimated_price_cents || 0
    const tip = r.tip_cents || 0
    return sum + jobPrice + tip
  }, 0)

  const totalJobs = completedStringerRequests.length

  // Debug logging
  console.log('Dashboard Debug:', {
    isStringer,
    stringerRequests,
    pendingStringerRequests,
    stringerRequestsLength: stringerRequests.length,
    pendingLength: pendingStringerRequests.length,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Success Toast */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 animate-slide-in">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Your request has been submitted!</span>
          <button
            onClick={() => setShowSuccessMessage(false)}
            className="ml-4 hover:bg-green-700 rounded p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile.full_name?.split(' ')[0] || 'Player'}!
          </h1>
          <p className="mt-2 text-gray-600">
            Track your tennis stringing activity
          </p>
        </div>

        {/* Quick Stats - Stringer Only */}
        {isStringer && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <Activity className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{pendingStringerRequests.length}</div>
                  <div className="text-sm text-gray-600">Pending</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{activeStringerRequests.length}</div>
                  <div className="text-sm text-gray-600">In Progress</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{totalJobs}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{formatPrice(totalEarnings)}</div>
                  <div className="text-sm text-gray-600">Total Earned</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stringer: Active Job Card */}
        {isStringer && activeStringerRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Active Job</h2>
            <ActiveJobCard
              request={activeStringerRequests[0]}
              player={activeStringerRequests[0].player}
            />
          </div>
        )}

        {/* Player: Active Request Card */}
        {!isStringer && activeRequests.length > 0 && activeRequests[0].status !== 'pending' && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {activeRequests[0].status === 'ready_for_pickup' ? 'Ready for Pickup' : 'Your Racket Status'}
            </h2>
            <PlayerActiveRequestCard
              request={activeRequests[0]}
              stringer={activeRequests[0].stringer || { full_name: 'Stringer' }}
            />
          </div>
        )}

        {/* Stringer: Pending Requests */}
        {isStringer && pendingStringerRequests.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Pending Requests ({pendingStringerRequests.length})
              </h2>
              {pendingStringerRequests.length > 3 && (
                <Button
                  variant="outline"
                  onClick={() => router.push('/requests')}
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  View All Requests
                </Button>
              )}
            </div>
            <div className="space-y-4">
              {pendingStringerRequests.slice(0, 3).map((request: any) => (
                <div
                  key={request.id}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow border-l-4 border-yellow-400"
                >
                  <div className="flex items-start space-x-4">
                    {/* Player Avatar */}
                    <Link href={`/stringer/${request.player_id}`}>
                      <img
                        src={request.player?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                        alt={request.player?.full_name || 'Player'}
                        className="w-16 h-16 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                      />
                    </Link>

                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <StatusBadge status={request.status} />
                        <h3 className="text-lg font-bold text-gray-900">
                          New Request from{' '}
                          <Link
                            href={`/stringer/${request.player_id}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {request.player?.full_name}
                          </Link>
                        </h3>
                        <span className="text-xl font-bold text-green-600">
                          {formatPrice(request.estimated_price_cents)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 mb-1">Service</p>
                          <p className="font-semibold text-gray-900 capitalize">
                            {request.service_type?.replace(/_/g, ' ')}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">String</p>
                          <p className="font-semibold text-gray-900">
                            {request.string_selection?.brand} {request.string_selection?.model}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Tension</p>
                          <p className="font-semibold text-gray-900">
                            M: {request.tension_mains_lbs} / C: {request.tension_crosses_lbs} lbs
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Requested</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {request.preferred_time_slot && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Preferred dropoff:</span>{' '}
                            {request.preferred_time_slot.day} {formatTimeRange(request.preferred_time_slot.start, request.preferred_time_slot.end)}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center space-x-3 mt-4">
                        <Button
                          variant="outline"
                          className="border-2 hover:bg-gray-50"
                          onClick={() => router.push(`/request/${request.id}`)}
                        >
                          View Details
                        </Button>
                        <Button
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => router.push(`/request/${request.id}`)}
                        >
                          Accept
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Requests */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {isStringer ? 'My Requests (as Player)' : 'Active Requests'}
          </h2>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
              ))}
            </div>
          ) : activeRequests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No active requests at the moment</p>
              <p className="text-gray-400 text-sm mt-1">Find a stringer to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <StatusBadge status={request.status} />
                        <h3 className="text-lg font-bold text-gray-900">
                          {request.service_type?.replace(/_/g, ' ')}
                        </h3>
                        {request.estimated_price_cents && (
                          <span className="text-xl font-bold text-green-600">
                            {formatPrice(request.estimated_price_cents)}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 mb-1">Stringer</p>
                          <p className="font-semibold text-gray-900">
                            {request.stringer?.full_name || 'Not assigned'}
                          </p>
                        </div>
                        {request.string_selection && (
                          <div>
                            <p className="text-gray-500 mb-1">String</p>
                            <p className="font-semibold text-gray-900">
                              {request.string_selection.brand} {request.string_selection.model}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-gray-500 mb-1">Tension</p>
                          <p className="font-semibold text-gray-900">
                            M: {request.tension_mains_lbs} / C: {request.tension_crosses_lbs} lbs
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Created</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(request.created_at!).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 ml-6">
                      <Button
                        variant="outline"
                        className="border-2 hover:bg-gray-50"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                      <Button
                        className="bg-primary hover:bg-primary/90"
                        onClick={() => router.push(`/request/${request.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recently Completed */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Recently Completed</h2>

          {isStringer && completedStringerRequests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {completedStringerRequests.slice(0, 6).map((request: any) => (
                <div
                  key={request.id}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow border-l-4 border-green-500"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <StatusBadge status={request.status} />
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 capitalize">
                        {request.service_type?.replace(/_/g, ' ')}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        for {request.player?.full_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-600">
                        {formatPrice(request.final_price_cents || request.estimated_price_cents)}
                      </div>
                      {request.tip_cents > 0 && (
                        <div className="text-sm text-green-600 font-medium mt-1">
                          + {formatPrice(request.tip_cents)} tip
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">String</span>
                      <span className="font-medium text-gray-900">
                        {request.string_selection?.brand} {request.string_selection?.model}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tension</span>
                      <span className="font-medium text-gray-900">
                        M: {request.tension_mains_lbs} / C: {request.tension_crosses_lbs} lbs
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Completed</span>
                      <span className="font-medium text-gray-700">
                        {request.completed_at ? new Date(request.completed_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Earned</span>
                      <span className="font-medium text-green-600">
                        {formatPrice((request.final_price_cents || request.estimated_price_cents) + (request.tip_cents || 0))}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push(`/request/${request.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : completedRequests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No completed jobs yet</p>
              <p className="text-gray-400 text-sm mt-1">Complete your first stringing request to see history</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {completedRequests.slice(0, 6).map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <StatusBadge status={request.status} />
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 capitalize">
                        {request.service_type?.replace(/_/g, ' ')}
                      </h3>
                    </div>
                    {request.final_price_cents && (
                      <div className="text-xl font-bold text-green-600">
                        {formatPrice(request.final_price_cents)}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Stringer</span>
                      <span className="font-medium text-gray-900">
                        {request.stringer?.full_name || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Completed</span>
                      <span className="font-medium text-gray-700">
                        {new Date(request.updated_at!).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t space-y-2">
                    {request.payment_intent_id && (
                      <Link href={`/request/${request.id}/payment`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          View Payment
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Rate & Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
