'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/use-auth'
import { Navigation } from '@/components/layout/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@rally-strings/ui'
import { StatusBadge, formatPrice } from '@rally-strings/ui'
import { Button } from '@rally-strings/ui'
import { Clock, DollarSign, Star, MessageSquare } from 'lucide-react'
import type { Request } from '@rally-strings/types'

export function DashboardPage() {
  const { profile } = useAuth()
  const supabase = createClient()

  // Fetch user's requests
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['my-requests', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []

      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          player:profiles!player_id(full_name),
          stringer:profiles!stringer_id(full_name)
        `)
        .or(`player_id.eq.${profile.id},stringer_id.eq.${profile.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as (Request & {
        player: { full_name: string }
        stringer: { full_name: string }
      })[]
    },
    enabled: !!profile?.id,
  })

  if (!profile) {
    return <div>Loading...</div>
  }

  const activeRequests = requests.filter(r => 
    ['requested', 'accepted', 'in_progress', 'ready'].includes(r.status)
  )
  const completedRequests = requests.filter(r => r.status === 'completed')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            {profile.role === 'player' ? 'Manage your restring requests' : 'Manage your stringing jobs'}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active {profile.role === 'player' ? 'Requests' : 'Jobs'}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeRequests.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedRequests.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent/Earned</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPrice(
                  completedRequests.reduce((sum, r) => sum + (r.quoted_price_cents || 0), 0)
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Requests */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Active {profile.role === 'player' ? 'Requests' : 'Jobs'}</CardTitle>
            <CardDescription>
              {profile.role === 'player' 
                ? 'Your current restring requests' 
                : 'Jobs you need to work on'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-200 h-20 rounded"></div>
                ))}
              </div>
            ) : activeRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No active {profile.role === 'player' ? 'requests' : 'jobs'} at the moment
              </p>
            ) : (
              <div className="space-y-4">
                {activeRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <StatusBadge status={request.status} />
                          <h3 className="font-medium">
                            {request.racquet_brand} {request.racquet_model}
                          </h3>
                          {request.quoted_price_cents && (
                            <span className="text-lg font-semibold text-green-600">
                              {formatPrice(request.quoted_price_cents)}
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                          <p>
                            {profile.role === 'player' ? 'Stringer' : 'Player'}: {' '}
                            <span className="font-medium">
                              {profile.role === 'player' 
                                ? request.stringer?.full_name || 'Not assigned'
                                : request.player?.full_name
                              }
                            </span>
                          </p>
                          {request.string_pref && (
                            <p>String: <span className="font-medium">{request.string_pref}</span></p>
                          )}
                          {request.tension_lbs && (
                            <p>Tension: <span className="font-medium">{request.tension_lbs} lbs</span></p>
                          )}
                          <p>Created: {new Date(request.created_at!).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Message
                        </Button>
                        
                        {profile.role === 'stringer' && request.status === 'requested' && (
                          <Button size="sm">
                            Accept Job
                          </Button>
                        )}
                        
                        {profile.role === 'stringer' && request.status === 'accepted' && (
                          <Button size="sm">
                            Start Work
                          </Button>
                        )}
                        
                        {profile.role === 'stringer' && request.status === 'in_progress' && (
                          <Button size="sm">
                            Mark Ready
                          </Button>
                        )}
                        
                        {profile.role === 'stringer' && request.status === 'ready' && (
                          <Button size="sm">
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Completed */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Completed</CardTitle>
            <CardDescription>
              Your last few completed {profile.role === 'player' ? 'requests' : 'jobs'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {completedRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No completed {profile.role === 'player' ? 'requests' : 'jobs'} yet
              </p>
            ) : (
              <div className="space-y-4">
                {completedRequests.slice(0, 5).map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">
                          {request.racquet_brand} {request.racquet_model}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {profile.role === 'player' ? 'Stringer' : 'Player'}: {' '}
                          <span className="font-medium">
                            {profile.role === 'player' 
                              ? request.stringer?.full_name
                              : request.player?.full_name
                            }
                          </span>
                        </p>
                        <p className="text-sm text-gray-500">
                          Completed: {new Date(request.updated_at!).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <StatusBadge status={request.status} />
                        {request.quoted_price_cents && (
                          <p className="text-lg font-semibold text-green-600 mt-1">
                            {formatPrice(request.quoted_price_cents)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
