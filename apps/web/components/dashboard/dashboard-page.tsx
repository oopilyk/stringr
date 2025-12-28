'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/use-auth'
import { Navigation } from '@/components/layout/navigation'
import { StatusBadge, formatPrice } from '@stringr/ui'
import { Button } from '@stringr/ui'
import { DollarSign, Star, MessageSquare, CheckCircle, Activity } from 'lucide-react'

export function DashboardPage() {
  const { profile } = useAuth()
  const supabase = createClient()

  // For demo purposes, use empty requests array instead of API calls
  const requests: any[] = []
  const isLoading = false

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
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile.full_name?.split(' ')[0] || 'Player'}!
          </h1>
          <p className="mt-2 text-gray-600">
            Track your tennis stringing activity
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{activeRequests.length}</div>
            <div className="text-gray-600">Active Requests</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{completedRequests.length}</div>
            <div className="text-gray-600">Completed Jobs</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {formatPrice(
                completedRequests.reduce((sum, r) => sum + (r.quoted_price_cents || 0), 0)
              )}
            </div>
            <div className="text-gray-600">Total Spent</div>
          </div>
        </div>

        {/* Active Requests */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Active Requests</h2>

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
                          {request.racquet_brand} {request.racquet_model}
                        </h3>
                        {request.quoted_price_cents && (
                          <span className="text-xl font-bold text-green-600">
                            {formatPrice(request.quoted_price_cents)}
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
                        {request.string_pref && (
                          <div>
                            <p className="text-gray-500 mb-1">String</p>
                            <p className="font-semibold text-gray-900">{request.string_pref}</p>
                          </div>
                        )}
                        {request.tension_lbs && (
                          <div>
                            <p className="text-gray-500 mb-1">Tension</p>
                            <p className="font-semibold text-gray-900">{request.tension_lbs} lbs</p>
                          </div>
                        )}
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
                      <Button className="bg-primary hover:bg-primary/90">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Completed */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Completed</h2>

          {completedRequests.length === 0 ? (
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
                      <h3 className="font-bold text-lg text-gray-900">
                        {request.racquet_brand} {request.racquet_model}
                      </h3>
                    </div>
                    {request.quoted_price_cents && (
                      <div className="text-xl font-bold text-green-600">
                        {formatPrice(request.quoted_price_cents)}
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

                  <div className="mt-4 pt-4 border-t">
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
