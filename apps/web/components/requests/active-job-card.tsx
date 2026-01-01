'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@stringr/ui'
import { Check, Circle, Loader2, Camera, AlertCircle, Clock, User, DollarSign, ChevronRight } from 'lucide-react'
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
  estimated_price_cents: number
  player_id: string
  service_type: string
  racket_photo_url: string
  string_selection: {
    brand: string
    model: string
  }
  tension_mains_lbs: number
  tension_crosses_lbs: number
}

interface Profile {
  full_name: string
  avatar_url?: string
  city?: string
}

interface ActiveJobCardProps {
  request: Request
  player: Profile
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

export function ActiveJobCard({ request, player }: ActiveJobCardProps) {
  const [tasks, setTasks] = useState<StringingTask[]>([])
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)
  const [completionNotes, setCompletionNotes] = useState('')
  const [isMarkingReady, setIsMarkingReady] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const supabase = createClient()
  const router = useRouter()

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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingPhoto(true)

      // Upload to Supabase Storage
      const fileName = `completion-${request.id}-${Date.now()}.${file.name.split('.').pop()}`
      const { data, error } = await supabase.storage
        .from('request-photos')
        .upload(fileName, file)

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('request-photos')
        .getPublicUrl(fileName)

      // Update the completion photo task
      const photoTask = tasks.find(t => t.task_type === 'completion_photo')
      if (photoTask) {
        const response = await fetch(`/api/requests/${request.id}/tasks/${photoTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'completed',
            photo_url: publicUrl
          })
        })

        if (response.ok) {
          await fetchTasks()
        }
      }
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Failed to upload photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const markReady = async () => {
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

  const currentTask = tasks.find(t => t.status === 'in_progress') ||
                      tasks.find(t => t.status === 'pending' && REQUIRED_TASKS.includes(t.task_type))

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg border-2 border-blue-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Active Job</h2>
              <p className="text-blue-100 text-sm">In Progress</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {formatPrice(request.estimated_price_cents)}
            </div>
            <p className="text-blue-100 text-xs">Estimated</p>
          </div>
        </div>
      </div>

      {/* Player Info & Progress */}
      <div className="p-6 border-b border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img
              src={player.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
              alt={player.full_name}
              className="w-12 h-12 rounded-full object-cover border-2 border-blue-300"
            />
            <div>
              <p className="font-semibold text-gray-900">{player.full_name}</p>
              <p className="text-sm text-gray-600">
                {request.string_selection.brand} {request.string_selection.model} • {request.tension_mains_lbs}/{request.tension_crosses_lbs} lbs
              </p>
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
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
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
        </div>

        {request.estimated_completion && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mt-3">
            <Clock className="w-4 h-4" />
            <span>
              Due: {new Date(request.estimated_completion).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </span>
          </div>
        )}
      </div>

      {/* Current/Next Task - Prominent Display */}
      {currentTask && (
        <div className="p-8 bg-gradient-to-br from-white to-blue-50 border-b-4 border-blue-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">
                {currentTask.status === 'in_progress' ? '▶ CURRENT STEP' : '● NEXT STEP'}
              </p>
              <h3 className="text-2xl font-bold text-gray-900">
                {TASK_LABELS[currentTask.task_type] || currentTask.task_type}
              </h3>
              {currentTask.status === 'in_progress' && currentTask.started_at && (
                <p className="text-sm text-gray-600 mt-1">
                  Started {new Date(currentTask.started_at).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              {currentTask.status === 'pending' && (
                <Button
                  onClick={() => updateTaskStatus(currentTask.id, 'in_progress')}
                  disabled={updatingTaskId === currentTask.id}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                >
                  {updatingTaskId === currentTask.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Start Task'
                  )}
                </Button>
              )}
              {currentTask.status === 'in_progress' && (
                <Button
                  onClick={() => updateTaskStatus(currentTask.id, 'completed')}
                  disabled={updatingTaskId === currentTask.id}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white px-8"
                >
                  {updatingTaskId === currentTask.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Mark Complete
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* All Tasks Checklist */}
      <div className="p-6 max-h-64 overflow-y-auto">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">All Tasks</h3>
        <div className="space-y-2">
          {tasks.map((task) => {
            const isRequired = REQUIRED_TASKS.includes(task.task_type)
            const isUpdating = updatingTaskId === task.id

            return (
              <div
                key={task.id}
                className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                  task.status === 'completed' ? 'bg-green-50' :
                  task.status === 'in_progress' ? 'bg-yellow-50' :
                  'bg-white'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
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
                    task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'
                  }`}>
                    {TASK_LABELS[task.task_type] || task.task_type}
                  </span>
                  {!isRequired && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                      Optional
                    </span>
                  )}
                </div>

                {/* Completion Photo Upload */}
                {task.task_type === 'completion_photo' && task.status === 'pending' && (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      id={`photo-upload-${task.id}`}
                      className="hidden"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto}
                    />
                    <label htmlFor={`photo-upload-${task.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="cursor-pointer"
                        disabled={uploadingPhoto}
                        onClick={(e) => {
                          e.preventDefault()
                          document.getElementById(`photo-upload-${task.id}`)?.click()
                        }}
                      >
                        {uploadingPhoto ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Camera className="w-4 h-4 mr-1" />
                            Upload
                          </>
                        )}
                      </Button>
                    </label>
                  </div>
                )}

                {/* Regular task buttons */}
                {task.task_type !== 'completion_photo' && task.status !== 'completed' && (
                  <div className="flex gap-2">
                    {task.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTaskStatus(task.id, 'in_progress')}
                        disabled={isUpdating}
                      >
                        {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Start'}
                      </Button>
                    )}
                    {task.status === 'in_progress' && (
                      <Button
                        size="sm"
                        onClick={() => updateTaskStatus(task.id, 'completed')}
                        disabled={isUpdating}
                      >
                        {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Done'}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Mark Ready Section */}
      {allRequiredComplete && (
        <div className="p-6 border-t border-blue-200 bg-gradient-to-br from-green-50 to-emerald-50">
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
                <p className="font-medium">Almost done!</p>
                <p>Please upload a completion photo to mark this job ready for pickup.</p>
              </div>
            </div>
          )}

          <Button
            className="w-full bg-green-600 hover:bg-green-700 text-white"
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
