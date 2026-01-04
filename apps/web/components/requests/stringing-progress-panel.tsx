'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@stringerly/ui'
import { Check, Circle, Loader2, Camera, AlertCircle, Clock } from 'lucide-react'

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
}

interface StringingProgressPanelProps {
  request: Request
  isStringer: boolean
}

const TASK_LABELS: Record<string, string> = {
  receive_racket: 'Receive Racket',
  remove_strings: 'Remove Old Strings',
  inspect_frame: 'Inspect Frame (Optional)',
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

export function StringingProgressPanel({ request, isStringer }: StringingProgressPanelProps) {
  const [tasks, setTasks] = useState<StringingTask[]>([])
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)
  const [completionNotes, setCompletionNotes] = useState('')
  const [completionPhotoUrl, setCompletionPhotoUrl] = useState('')
  const [isMarkingReady, setIsMarkingReady] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchTasks()
    subscribeToTaskUpdates()
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

  const subscribeToTaskUpdates = () => {
    const channel = supabase
      .channel(`request-tasks:${request.id}`)
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

  const updateTaskStatus = async (taskId: string, status: 'in_progress' | 'completed', notes?: string) => {
    try {
      setUpdatingTaskId(taskId)

      const response = await fetch(`/api/requests/${request.id}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes })
      })

      if (response.ok) {
        await fetchTasks()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update task')
      }
    } catch (error) {
      console.error('Error updating task:', error)
      alert('Failed to update task')
    } finally {
      setUpdatingTaskId(null)
    }
  }

  const markReady = async () => {
    // Find completion photo task
    const photoTask = tasks.find(t => t.task_type === 'completion_photo')
    if (!photoTask || photoTask.status !== 'completed' || !photoTask.photo_url) {
      alert('Please complete the completion photo task first')
      return
    }

    try {
      setIsMarkingReady(true)

      const response = await fetch(`/api/requests/${request.id}/mark-ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completion_notes: completionNotes,
          completion_photo_url: photoTask.photo_url
        })
      })

      if (response.ok) {
        alert('Request marked as ready for pickup!')
        window.location.reload()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to mark ready')
      }
    } catch (error) {
      console.error('Error marking ready:', error)
      alert('Failed to mark ready')
    } finally {
      setIsMarkingReady(false)
    }
  }

  const allRequiredComplete = tasks
    .filter(t => REQUIRED_TASKS.includes(t.task_type))
    .every(t => t.status === 'completed')

  const canMarkReady = allRequiredComplete &&
    tasks.find(t => t.task_type === 'completion_photo')?.status === 'completed'

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header with Progress Bar */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {isStringer ? 'Stringing Progress' : 'Request Progress'}
          </h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            request.status === 'completed' ? 'bg-green-100 text-green-800' :
            request.status === 'ready_for_pickup' ? 'bg-blue-100 text-blue-800' :
            request.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
            request.status === 'accepted' ? 'bg-purple-100 text-purple-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {request.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-medium text-gray-900">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Estimated Completion */}
        {request.estimated_completion && request.status !== 'completed' && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>
              Estimated completion: {new Date(request.estimated_completion).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Task List */}
      <div className="divide-y">
        {tasks.map((task) => {
          const isRequired = REQUIRED_TASKS.includes(task.task_type)
          const isUpdating = updatingTaskId === task.id

          return (
            <div key={task.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start gap-3">
                {/* Status Icon */}
                <div className="mt-1">
                  {task.status === 'completed' ? (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  ) : task.status === 'in_progress' ? (
                    <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    </div>
                  ) : (
                    <Circle className="w-6 h-6 text-gray-300" />
                  )}
                </div>

                {/* Task Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-medium ${
                      task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'
                    }`}>
                      {TASK_LABELS[task.task_type] || task.task_type}
                    </h3>
                    {!isRequired && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                        Optional
                      </span>
                    )}
                  </div>

                  {task.notes && (
                    <p className="text-sm text-gray-600 mt-1">{task.notes}</p>
                  )}

                  {task.photo_url && (
                    <div className="mt-2">
                      <img
                        src={task.photo_url}
                        alt="Task photo"
                        className="w-32 h-32 object-cover rounded border"
                      />
                    </div>
                  )}

                  {task.started_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      Started: {new Date(task.started_at).toLocaleString()}
                    </p>
                  )}
                  {task.completed_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      Completed: {new Date(task.completed_at).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Action Buttons (Stringer Only) */}
                {isStringer && request.status !== 'completed' && request.status !== 'cancelled' && (
                  <div className="flex gap-2">
                    {task.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTaskStatus(task.id, 'in_progress')}
                        disabled={isUpdating}
                      >
                        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Start'}
                      </Button>
                    )}
                    {task.status === 'in_progress' && (
                      <Button
                        size="sm"
                        onClick={() => updateTaskStatus(task.id, 'completed')}
                        disabled={isUpdating}
                      >
                        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Complete'}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Mark Ready Section (Stringer Only) */}
      {isStringer && request.status === 'in_progress' && (
        <div className="p-6 border-t bg-gray-50">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Completion Notes (Optional)
            </label>
            <textarea
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={3}
              placeholder="Add any notes about the completed job..."
            />
          </div>

          {!canMarkReady && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Cannot mark ready yet</p>
                <p>Please complete all required tasks and upload a completion photo.</p>
              </div>
            </div>
          )}

          <Button
            className="w-full"
            onClick={markReady}
            disabled={!canMarkReady || isMarkingReady}
          >
            {isMarkingReady ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Mark Ready for Pickup
          </Button>
        </div>
      )}
    </div>
  )
}
