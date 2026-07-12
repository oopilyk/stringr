'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button, formatPrice } from '@stringerly/ui'
import { GripVertical, Zap } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Request {
  id: string
  player_id: string
  service_type: string
  string_selection: {
    brand: string
    model: string
  }
  tension_mains_lbs: number
  tension_crosses_lbs: number
  final_price_cents: number | null
  estimated_price_cents: number
  is_rush: boolean
  payment_authorized_at: string
  player: {
    full_name: string
    avatar_url: string | null
  }
}

interface SortableQueueProps {
  requests: Request[]
  onStartWork: (requestId: string) => Promise<void>
  stringerId: string
}

function SortableQueueItem({ request, index, onStartWork }: { request: Request; index: number; onStartWork: (id: string) => Promise<void> }) {
  const router = useRouter()
  const [isStarting, setIsStarting] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: request.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  }

  const handleStart = async () => {
    setIsStarting(true)
    try {
      await onStartWork(request.id)
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow border-l-4 ${
        request.is_rush ? 'border-red-500 bg-red-50' : 'border-green-500'
      } ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="flex items-center gap-3">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 -m-2 hover:bg-gray-100 rounded touch-none"
        >
          <GripVertical className="w-5 h-5 text-gray-400" />
        </div>

        {/* Queue Position */}
        <div className="flex flex-col items-center min-w-[40px]">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            request.is_rush ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            #{index + 1}
          </div>
        </div>

        {/* Player Avatar */}
        <Link href={`/stringer/${request.player_id}`}>
          <img
            src={request.player?.avatar_url || '/default-avatar.png'}
            alt={request.player?.full_name || 'Player'}
            className="w-12 h-12 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
          />
        </Link>

        {/* Request Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {request.is_rush && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-700">
                <Zap className="w-3 h-3" />
                RUSH
              </span>
            )}
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
              💳 Paid
            </span>
          </div>

          <h3 className="font-semibold text-gray-900 truncate mt-1">
            <Link
              href={`/stringer/${request.player_id}`}
              className="hover:text-blue-600 hover:underline"
            >
              {request.player?.full_name}
            </Link>
          </h3>

          <p className="text-sm text-gray-600 truncate">
            {request.string_selection?.brand} {request.string_selection?.model} • {request.tension_mains_lbs}/{request.tension_crosses_lbs} lbs
          </p>
        </div>

        {/* Price */}
        <div className="text-right">
          <div className="font-bold text-green-600">
            {formatPrice(request.final_price_cents || request.estimated_price_cents)}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/request/${request.id}`)}
          >
            Details
          </Button>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={handleStart}
            disabled={isStarting}
          >
            {isStarting ? 'Starting...' : 'Start'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function SortableQueue({ requests: initialRequests, onStartWork, stringerId }: SortableQueueProps) {
  const [requests, setRequests] = useState(initialRequests)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Broadcast queue reorder to all players in the queue
  const broadcastQueueUpdate = async () => {
    const channel = supabase.channel(`stringer-queue:${stringerId}`)
    await channel.subscribe()
    await channel.send({
      type: 'broadcast',
      event: 'queue_reordered',
      payload: { stringer_id: stringerId, timestamp: Date.now() }
    })
    // Unsubscribe after sending
    setTimeout(() => supabase.removeChannel(channel), 1000)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = requests.findIndex((r) => r.id === active.id)
      const newIndex = requests.findIndex((r) => r.id === over.id)

      const newOrder = arrayMove(requests, oldIndex, newIndex)
      setRequests(newOrder)

      // Save the new order to the server
      setIsSaving(true)
      try {
        const response = await fetch('/api/requests/reorder-queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            request_ids: newOrder.map((r) => r.id)
          })
        })

        if (!response.ok) {
          // Revert on error
          setRequests(initialRequests)
          alert('Failed to save queue order')
        } else {
          // Broadcast to players that queue order changed
          broadcastQueueUpdate()
        }
      } catch (error) {
        setRequests(initialRequests)
        alert('Failed to save queue order')
      } finally {
        setIsSaving(false)
      }
    }
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8 bg-white rounded-lg shadow">
        <p className="text-gray-500">No requests ready to start</p>
        <p className="text-gray-400 text-sm mt-1">Requests will appear here once players authorize payment</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-500">
          Drag to reorder • Players will see their position update
        </p>
        {isSaving && (
          <span className="text-sm text-blue-600 animate-pulse">Saving...</span>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={requests.map((r) => r.id)}
          strategy={verticalListSortingStrategy}
        >
          {requests.map((request, index) => (
            <SortableQueueItem
              key={request.id}
              request={request}
              index={index}
              onStartWork={onStartWork}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )
}
