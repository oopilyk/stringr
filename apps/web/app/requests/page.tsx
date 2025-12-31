'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/use-auth'
import { Navigation } from '@/components/layout/navigation'
import { StatusBadge, formatPrice } from '@stringr/ui'
import { Button } from '@stringr/ui'
import { ChevronLeft, Calendar, MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'

type RequestStatus = 'all' | 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'

export default function AllRequestsPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const router = useRouter()
  const [filterStatus, setFilterStatus] = useState<RequestStatus>('all')

  // Fetch all stringer requests
  const { data: stringerRequests = [], isLoading } = useQuery({
    queryKey: ['all-stringer-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { data: requests, error: requestsError } = await supabase
        .from('requests')
        .select('*')
        .eq('stringer_id', user.id)
        .order('created_at', { ascending: false })

      if (requestsError) {
        console.error('Error fetching requests:', requestsError)
        return []
      }

      if (!requests || requests.length === 0) return []

      // Fetch player profiles
      const playerIds = [...new Set(requests.map(r => r.player_id))]
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, city')
        .in('id', playerIds)

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        return requests
      }

      return requests.map(request => ({
        ...request,
        player: profiles?.find(p => p.id === request.player_id)
      }))
    },
    enabled: !!user?.id,
  })

  // Filter requests based on selected status
  const filteredRequests = filterStatus === 'all'
    ? stringerRequests
    : stringerRequests.filter(r => r.status === filterStatus)

  const statusCounts = {
    all: stringerRequests.length,
    pending: stringerRequests.filter(r => r.status === 'pending').length,
    accepted: stringerRequests.filter(r => r.status === 'accepted').length,
    in_progress: stringerRequests.filter(r => r.status === 'in_progress').length,
    completed: stringerRequests.filter(r => r.status === 'completed').length,
    cancelled: stringerRequests.filter(r => r.status === 'cancelled').length,
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">Loading requests...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to Dashboard
        </button>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">All Requests</h1>
          <p className="mt-2 text-gray-600">Manage all your stringing requests</p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(statusCounts) as RequestStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  filterStatus === status
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {status === 'all' ? 'All' : status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                {' '}
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  filterStatus === status ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {statusCounts[status]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No {filterStatus !== 'all' ? filterStatus.replace(/_/g, ' ') : ''} requests found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request: any) => (
              <div
                key={request.id}
                className={`bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow border-l-4 ${
                  request.status === 'pending' ? 'border-yellow-400' :
                  request.status === 'accepted' || request.status === 'in_progress' ? 'border-blue-500' :
                  request.status === 'completed' ? 'border-green-500' :
                  'border-gray-300'
                }`}
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
                        Request from{' '}
                        <Link
                          href={`/stringer/${request.player_id}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {request.player?.full_name}
                        </Link>
                      </h3>
                      <span className="text-xl font-bold text-green-600">
                        {formatPrice(request.final_price_cents || request.estimated_price_cents)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-gray-500">Service:</span>{' '}
                        <span className="font-medium text-gray-900 capitalize">
                          {request.service_type?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">String:</span>{' '}
                        <span className="font-medium text-gray-900">
                          {request.string_selection?.brand} {request.string_selection?.model}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Tension:</span>{' '}
                        <span className="font-medium text-gray-900">
                          M: {request.tension_mains_lbs} / C: {request.tension_crosses_lbs} lbs
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Submitted:</span>{' '}
                        <span className="font-medium text-gray-900">
                          {new Date(request.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {request.preferred_time_slot && (
                      <div className="mb-3 p-3 bg-blue-50 rounded-lg flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Preferred dropoff:</span>{' '}
                          {request.preferred_time_slot.day} {request.preferred_time_slot.start} - {request.preferred_time_slot.end}
                        </p>
                      </div>
                    )}

                    {request.dropoff_method && (
                      <div className="mb-3 flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>
                          <span className="font-medium">{request.dropoff_method.method}</span>
                          {request.dropoff_method.details && ` - ${request.dropoff_method.details}`}
                        </span>
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
                      {request.status === 'pending' && (
                        <Button className="bg-green-600 hover:bg-green-700">
                          Accept
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
