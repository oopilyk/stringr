'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@stringr/ui'
import { Check, Circle, Loader2, Clock, User, ChevronRight, Package, Wrench } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@stringr/ui'

interface StringingTask {
  id: string
  request_id: string
  task_type: string
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  started_at: string | null
  completed_at: string | null
  notes: string | null
  photo_url: string | null
  created_at: string
}

interface Request {
  id: string
  status: string
  estimated_completion: string | null
  work_started_at: string | null
  ready_at: string | null
  completed_at: string | null
  estimated_price_cents: number
  stringer_id: string
  service_type: string
  completion_photo_url?: string
  completion_notes?: string
}

interface Profile {
  full_name: string
  avatar_url?: string
  city?: string
}

interface PlayerActiveRequestCardProps {
  request: Request
  stringer: Profile
}

const TASK_LABELS: Record<string, string> = {
  receive_racket: 'Receive Racket',
  remove_strings: 'Remove Old Strings',
  inspect_frame: 'Inspect Frame',
  mount_racket: 'Mount Racket',
  string_mains: 'String Mains',
  string_crosses: 'String Crosses',
  tie_off: 'Tie Off & Trim',
  final_inspection: 'Final Inspection',
  completion_photo: 'Take Completion Photo'
}

const REQUIRED_TASKS = [
  'receive_racket',
  'remove_strings',
  'mount_racket',
  'string_mains',
  'string_crosses',
  'tie_off',
  'final_inspection'
]

export function PlayerActiveRequestCard({ request, stringer }: PlayerActiveRequestCardProps) {
  const [tasks, setTasks] = useState<StringingTask[]>([])
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isCompleting, setIsCompleting] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchTasks()
    subscribeToUpdates()
  }, [request.id])

  const fetchTasks = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/requests/${request.id}/tasks`)
      const data = await response.json()

      if (response.ok) {
        setTasks(data.tasks || [])
        setProgress(data.progress || 0)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const subscribeToUpdates = () => {
    const channel = supabase
      .channel(`player-request-updates:${request.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stringing_tasks',
        filter: `request_id=eq.${request.id}`
      }, () => {
        fetchTasks()
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'requests',
        filter: `id=eq.${request.id}`
      }, () => {
        window.location.reload()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleConfirmPickup = async () => {
    if (!confirm('Have you picked up your racket? This will complete the request.')) return

    try {
      setIsCompleting(true)

      const response = await fetch(`/api/requests/${request.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        alert('Request completed! Don\'t forget to leave a review.')
        window.location.reload()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to complete request')
      }
    } catch (error) {
      console.error('Error completing request:', error)
      alert('Failed to complete request')
    } finally {
      setIsCompleting(false)
    }
  }

  const currentTask = tasks.find(t => t.status === 'in_progress') ||
                      tasks.find(t => t.status === 'pending' && REQUIRED_TASKS.includes(t.task_type))

  const completedTasks = tasks.filter(t => t.status === 'completed' && REQUIRED_TASKS.includes(t.task_type))

  // Ready for pickup view
  if (request.status === 'ready_for_pickup') {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg border-2 border-green-300 overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Your Racket is Ready!</h2>
              <p className="text-green-100 text-sm">Ready for Pickup</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <img
              src={stringer.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=stringer'}
              alt={stringer.full_name}
              className="w-16 h-16 rounded-full object-cover border-2 border-green-300"
            />
            <div>
              <p className="text-sm text-gray-600">Strung by</p>
              <p className="font-bold text-gray-900 text-lg">{stringer.full_name}</p>
            </div>
          </div>

          {request.completion_photo_url && (
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Completed Racket</p>
              <img
                src={request.completion_photo_url}
                alt="Completed racket"
                className="w-full h-64 object-cover rounded-lg border-2 border-green-200"
              />
            </div>
          )}

          {request.completion_notes && (
            <div className="mb-6 p-4 bg-white rounded-lg border border-green-200">
              <p className="text-sm font-medium text-gray-700 mb-1">Notes from Stringer</p>
              <p className="text-gray-900">{request.completion_notes}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={handleConfirmPickup}
              disabled={isCompleting}
            >
              {isCompleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Confirm Pickup
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/request/${request.id}`)}
            >
              Details
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // In progress view
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg border-2 border-blue-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <Wrench className="w-6 h-6 text-blue-600 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Your Racket is Being Strung</h2>
              <p className="text-blue-100 text-sm">
                {request.status === 'accepted' ? 'Waiting to Start' : 'In Progress'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Stringer Info */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <img
              src={stringer.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=stringer'}
              alt={stringer.full_name}
              className="w-12 h-12 rounded-full object-cover border-2 border-blue-300"
            />
            <div>
              <p className="text-sm text-gray-600">Your Stringer</p>
              <p className="font-semibold text-gray-900">{stringer.full_name}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/request/${request.id}`)}
          >
            Details
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-bold text-gray-900">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500 relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-600">
              {completedTasks.length} of {REQUIRED_TASKS.length} steps completed
            </span>
            {request.estimated_completion && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Clock className="w-3 h-3" />
                <span>
                  Due {new Date(request.estimated_completion).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Current Task */}
        {currentTask && (
          <div className="p-4 bg-white rounded-lg border-2 border-blue-300 mb-4">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                {currentTask.status === 'in_progress' ? (
                  <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                ) : (
                  <Circle className="w-6 h-6 text-blue-500" />
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  {currentTask.status === 'in_progress' ? 'Current Step' : 'Next Step'}
                </p>
                <h3 className="font-semibold text-gray-900">
                  {TASK_LABELS[currentTask.task_type] || currentTask.task_type}
                </h3>
                {currentTask.status === 'in_progress' && currentTask.started_at && (
                  <p className="text-xs text-gray-500 mt-1">
                    Started {new Date(currentTask.started_at).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Task Checklist */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Progress Steps</h3>
          {tasks
            .filter(t => REQUIRED_TASKS.includes(t.task_type))
            .map((task) => (
              <div
                key={task.id}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  task.status === 'completed' ? 'bg-green-50' :
                  task.status === 'in_progress' ? 'bg-yellow-50' :
                  'bg-white border border-gray-200'
                }`}
              >
                {task.status === 'completed' ? (
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                ) : task.status === 'in_progress' ? (
                  <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Loader2 className="w-3 h-3 text-white animate-spin" />
                  </div>
                ) : (
                  <Circle className="w-5 h-5 text-gray-300" />
                )}
                <span className={`text-sm ${
                  task.status === 'completed' ? 'text-gray-500 line-through' :
                  task.status === 'in_progress' ? 'text-gray-900 font-medium' :
                  'text-gray-600'
                }`}>
                  {TASK_LABELS[task.task_type] || task.task_type}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
