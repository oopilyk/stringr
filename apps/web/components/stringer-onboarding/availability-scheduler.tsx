'use client'

import { useState } from 'react'
import { AvailabilityBlock } from '@stringr/types'
import { Button, Card } from '@stringr/ui'
import { Plus, Trash2 } from 'lucide-react'

interface AvailabilitySchedulerProps {
  availability: AvailabilityBlock[]
  onChange: (availability: AvailabilityBlock[]) => void
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function AvailabilityScheduler({ availability, onChange }: AvailabilitySchedulerProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const addTimeBlock = (dow: number) => {
    const newBlock: AvailabilityBlock = {
      dow,
      start: '09:00',
      end: '17:00',
    }
    onChange([...availability, newBlock])
  }

  const removeTimeBlock = (index: number) => {
    onChange(availability.filter((_, i) => i !== index))
  }

  const updateTimeBlock = (index: number, field: 'start' | 'end', value: string) => {
    const updated = [...availability]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  const getBlocksForDay = (dow: number) => {
    return availability
      .map((block, index) => ({ block, index }))
      .filter(({ block }) => block.dow === dow)
  }

  const copyToAllDays = (dow: number) => {
    const dayBlocks = availability.filter((block) => block.dow === dow)
    if (dayBlocks.length === 0) return

    // Remove all existing blocks and add copies for each day
    const otherBlocks = availability.filter((block) => block.dow !== dow)
    const newBlocks: AvailabilityBlock[] = []

    DAYS_OF_WEEK.forEach((_, dayIndex) => {
      dayBlocks.forEach((block) => {
        newBlocks.push({
          dow: dayIndex,
          start: block.start,
          end: block.end,
        })
      })
    })

    onChange(newBlocks)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
        {DAYS_OF_WEEK.map((day, dow) => {
          const blocks = getBlocksForDay(dow)
          const isActive = blocks.length > 0

          return (
            <Card
              key={dow}
              className={`p-3 cursor-pointer transition-colors ${
                isActive ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-gray-50'
              } ${selectedDay === dow ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedDay(dow)}
            >
              <div className="text-center">
                <div className="font-semibold text-sm mb-1">{day.slice(0, 3)}</div>
                <div className="text-xs text-gray-600">
                  {blocks.length > 0 ? `${blocks.length} slot${blocks.length > 1 ? 's' : ''}` : 'Closed'}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {selectedDay !== null && (
        <Card className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold">{DAYS_OF_WEEK[selectedDay]}</h4>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => copyToAllDays(selectedDay)}>
                Copy to All Days
              </Button>
              <Button type="button" size="sm" onClick={() => addTimeBlock(selectedDay)}>
                <Plus className="w-4 h-4 mr-1" />
                Add Time Slot
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {getBlocksForDay(selectedDay).map(({ block, index }) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={block.start}
                      onChange={(e) => updateTimeBlock(index, 'start', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
                    <input
                      type="time"
                      value={block.end}
                      onChange={(e) => updateTimeBlock(index, 'end', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm"
                    />
                  </div>
                </div>
                <Button type="button" size="sm" variant="ghost" onClick={() => removeTimeBlock(index)} className="mt-5">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            ))}

            {getBlocksForDay(selectedDay).length === 0 && (
              <div className="text-center py-4 text-sm text-gray-500">
                No time slots for this day. Click "Add Time Slot" to get started.
              </div>
            )}
          </div>
        </Card>
      )}

      {selectedDay === null && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 mb-2">Click on a day above to add your availability</p>
          <p className="text-xs text-gray-400">You can add multiple time slots per day</p>
        </div>
      )}
    </div>
  )
}
