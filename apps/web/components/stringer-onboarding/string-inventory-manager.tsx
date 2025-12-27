'use client'

import { useState } from 'react'
import { StringInventoryItem, STRING_PRESETS } from '@rally-strings/types'
import { Button, Card } from '@rally-strings/ui'
import { Plus, Edit, Trash2, Check, X, DollarSign } from 'lucide-react'

interface StringInventoryManagerProps {
  inventory: StringInventoryItem[]
  onChange: (inventory: StringInventoryItem[]) => void
}

export function StringInventoryManager({ inventory, onChange }: StringInventoryManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<StringInventoryItem | null>(null)

  const generateId = () => `temp-${Date.now()}-${Math.random()}`

  const addNew = () => {
    const newItem: StringInventoryItem = {
      id: generateId(),
      brand: '',
      model: '',
      gauge: '',
      quantity: 0,
      price_cents: 0,
    }
    setEditingId(newItem.id!)
    setEditForm(newItem)
  }

  const editItem = (item: StringInventoryItem) => {
    setEditingId(item.id!)
    setEditForm({ ...item })
  }

  const saveItem = () => {
    if (!editForm) return

    const exists = inventory.some((item) => item.id === editForm.id)
    if (exists) {
      onChange(inventory.map((item) => (item.id === editForm.id ? editForm : item)))
    } else {
      onChange([...inventory, editForm])
    }
    setEditingId(null)
    setEditForm(null)
  }

  const deleteItem = (id: string) => {
    onChange(inventory.filter((item) => item.id !== id))
  }

  const cancelEdit = () => {
    // If it was a new item (not in inventory), don't add it
    setEditingId(null)
    setEditForm(null)
  }

  const quickAddPreset = (preset: string) => {
    // Parse preset like "Babolat RPM Blast 17"
    const parts = preset.split(' ')
    const gauge = parts[parts.length - 1]
    const model = parts.slice(1, -1).join(' ')
    const brand = parts[0]

    const newItem: StringInventoryItem = {
      id: generateId(),
      brand,
      model,
      gauge,
      quantity: 10,
      price_cents: 1500,
    }
    onChange([...inventory, newItem])
  }

  return (
    <div className="space-y-4">
      {/* Quick Add from Presets */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Quick add popular strings:</label>
        <div className="flex flex-wrap gap-2">
          {STRING_PRESETS.slice(0, 4).map((preset) => (
            <Button key={preset} type="button" variant="outline" size="sm" onClick={() => quickAddPreset(preset)}>
              <Plus className="w-3 h-3 mr-1" />
              {preset}
            </Button>
          ))}
        </div>
      </div>

      {/* Inventory List */}
      <div className="space-y-2">
        {inventory.map((item) =>
          editingId === item.id ? (
            <Card key={item.id} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Brand*</label>
                  <input
                    type="text"
                    placeholder="Babolat"
                    value={editForm?.brand || ''}
                    onChange={(e) => setEditForm({ ...editForm!, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Model*</label>
                  <input
                    type="text"
                    placeholder="RPM Blast"
                    value={editForm?.model || ''}
                    onChange={(e) => setEditForm({ ...editForm!, model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Gauge*</label>
                  <input
                    type="text"
                    placeholder="17"
                    value={editForm?.gauge || ''}
                    onChange={(e) => setEditForm({ ...editForm!, gauge: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Qty in Stock*</label>
                  <input
                    type="number"
                    placeholder="10"
                    value={editForm?.quantity || 0}
                    onChange={(e) => setEditForm({ ...editForm!, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Price per Set*</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="15.00"
                      value={editForm?.price_cents ? (editForm.price_cents / 100).toFixed(2) : '0.00'}
                      onChange={(e) =>
                        setEditForm({ ...editForm!, price_cents: Math.round((parseFloat(e.target.value) || 0) * 100) })
                      }
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button type="button" size="sm" onClick={saveItem}>
                  <Check className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={cancelEdit}>
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </Card>
          ) : (
            <Card key={item.id} className="p-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <div className="text-sm">
                <span className="font-medium">
                  {item.brand} {item.model}
                </span>
                <span className="text-gray-500 ml-2">Gauge: {item.gauge}</span>
                <span className="text-gray-500 ml-2">Qty: {item.quantity}</span>
                <span className="text-gray-500 ml-2">${(item.price_cents / 100).toFixed(2)}</span>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="ghost" onClick={() => editItem(item)}>
                  <Edit className="w-3 h-3" />
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => deleteItem(item.id!)}>
                  <Trash2 className="w-3 h-3 text-red-600" />
                </Button>
              </div>
            </Card>
          )
        )}
      </div>

      {/* Add New Button */}
      {editingId === null && (
        <Button type="button" variant="outline" onClick={addNew} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add String to Inventory
        </Button>
      )}

      {/* Empty State */}
      {inventory.length === 0 && editingId === null && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 mb-3">No strings in inventory yet</p>
          <p className="text-xs text-gray-400 mb-4">
            Add strings you have in stock so players know what's available
          </p>
          <Button type="button" onClick={addNew}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First String
          </Button>
        </div>
      )}
    </div>
  )
}
