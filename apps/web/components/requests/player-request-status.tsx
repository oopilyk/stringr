'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@stringr/ui'
import { Check, Clock, Package, Loader2, MessageSquare, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface StringingTask {
  id: string
  task_type: string
  status: string
  completed_at: string | null
}

interface Request {
  id: string
  status: string
  estimated_completion: string | null
  accepted_at: string | null
  work_started_at: string | null
  ready_at: string | null
  completed_at: string | null
  completion_notes: string | null
  completion_photo_url: string | null
  stringer_id: string
}

interface Stringer {
  id: string
  full_name: string
  avatar_url: string | null
}

interface PlayerRequestStatusProps {
  request: Request
  stringer: Stringer
}

const TASK_LABELS: Record<string, string> = {
  receive_racket: 'Racket Received',
  remove_strings: 'Strings Removed',
  mount_racket: 'Racket Mounted',
  string_mains: 'Mains Strung',
  string_crosses: 'Crosses Strung',
  tie_off: 'Tied Off',
  final_inspection: 'Final Inspection'
}

export function PlayerRequestStatus({ request, stringer }: PlayerRequestStatusProps) {
  const [tasks, setTasks] = useState<StringingTask[]>([])
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isCompleting, setIsCompleting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (request.status !== 'pending') {
      fetchTasks()
      subscribeToUpdates()
    } else {
      setIsLoading(false)
    }
  }, [request.id, request.status])

  const fetchTasks = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/requests/${request.id}/tasks`)
      const data = await response.json()

      if (response.ok) {
        // Only show required tasks to player
        const requiredTaskTypes = [
          'receive_racket',
          'remove_strings',
          'mount_racket',
          'string_mains',
          'string_crosses',
          'tie_off',
          'final_inspection'
        ]
        const requiredTasks = data.tasks?.filter((t: StringingTask) =>
          requiredTaskTypes.includes(t.task_type)
        ) || []

        setTasks(requiredTasks)
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
      .channel(`request-updates:${request.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'requests',
        filter: `id=eq.${request.id}`
      }, () => {
        window.location.reload() // Refresh to get updated request
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stringing_tasks',
        filter: `request_id=eq.${request.id}`
      }, () => {
        fetchTasks()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const completeRequest = async () => {
    if (!confirm('Confirm you have picked up your racket?')) return

    try {
      setIsCompleting(true)

      const response = await fetch(`/api/requests/${request.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
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

  // Pending state - waiting for stringer to accept
  if (request.status === 'pending') {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Waiting for Stringer to Accept
          </h3>
          <p className="text-gray-600 mb-4">
            Your request has been sent to {stringer.full_name}. You'll be notified when they accept.
          </p>
          <Link href={`/messages?conversation=${stringer.id}`}>
            <Button variant="outline" size="sm">
              <MessageSquare className="w-4 h-4 mr-2" />
              Message Stringer
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Accepted state - stringer accepted, not started yet
  if (request.status === 'accepted' && !request.work_started_at) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Request Accepted!
          </h3>
          <p className="text-gray-600 mb-2">
            {stringer.full_name} has accepted your request.
          </p>
          {request.estimated_completion && (
            <p className="text-sm text-gray-500 mb-4">
              Estimated completion: {new Date(request.estimated_completion).toLocaleString()}
            </p>
          )}
          <Link href={`/messages?conversation=${stringer.id}`}>
            <Button variant="outline" size="sm">
              <MessageSquare className="w-4 h-4 mr-2" />
              Message Stringer
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // In Progress - show live progress
  if (request.status === 'in_progress' || request.status === 'accepted') {
    return (
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Stringing in Progress</h2>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
              In Progress
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm font-medium text-gray-900">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {request.estimated_completion && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>
                Estimated completion: {new Date(request.estimated_completion).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Task List */}
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="divide-y">
            {tasks.map((task) => (
              <div key={task.id} className="p-4">
                <div className="flex items-center gap-3">
                  <div>
                    {task.status === 'completed' ? (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    ) : task.status === 'in_progress' ? (
                      <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className={`font-medium ${
                      task.status === 'completed' ? 'text-gray-500' : 'text-gray-900'
                    }`}>
                      {TASK_LABELS[task.task_type] || task.task_type}
                    </h3>
                    {task.completed_at && (
                      <p className="text-xs text-gray-500 mt-1">
                        Completed {new Date(task.completed_at).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <Link href={`/messages?conversation=${stringer.id}`}>
            <Button variant="outline" className="w-full">
              <MessageSquare className="w-4 h-4 mr-2" />
              Message {stringer.full_name}
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Ready for Pickup
  if (request.status === 'ready_for_pickup') {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Your Racket is Ready!
            </h3>
            <p className="text-gray-600 mb-6">
              Pick up your freshly strung racket from {stringer.full_name}
            </p>

            {/* Completion Photo */}
            {request.completion_photo_url && (
              <div className="mb-6">
                <img
                  src={request.completion_photo_url}
                  alt="Completed racket"
                  className="w-full max-w-md mx-auto rounded-lg border shadow-sm"
                />
              </div>
            )}

            {/* Completion Notes */}
            {request.completion_notes && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg text-left">
                <h4 className="font-medium text-gray-900 mb-2">Stringer Notes</h4>
                <p className="text-sm text-gray-700">{request.completion_notes}</p>
              </div>
            )}

            <Button
              onClick={completeRequest}
              disabled={isCompleting}
              className="w-full"
            >
              {isCompleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Confirm Pickup
            </Button>

            <Link href={`/messages?conversation=${stringer.id}`}>
              <Button variant="outline" className="w-full mt-3">
                <MessageSquare className="w-4 h-4 mr-2" />
                Message {stringer.full_name}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Completed
  if (request.status === 'completed') {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Request Completed
          </h3>
          <p className="text-gray-600 mb-6">
            Completed on {request.completed_at && new Date(request.completed_at).toLocaleDateString()}
          </p>

          {request.completion_photo_url && (
            <div className="mb-6">
              <img
                src={request.completion_photo_url}
                alt="Completed racket"
                className="w-full max-w-md mx-auto rounded-lg border shadow-sm"
              />
            </div>
          )}

          {request.completion_notes && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg text-left">
              <h4 className="font-medium text-gray-900 mb-2">Stringer Notes</h4>
              <p className="text-sm text-gray-700">{request.completion_notes}</p>
            </div>
          )}

          <Button variant="outline" className="w-full">
            Leave a Review
          </Button>
        </div>
      </div>
    )
  }

  return null
}
