'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  Button,
  formatPrice
} from '@rally-strings/ui'
import type { StringerSearchResult, CreateRequestFormData, RACQUET_PRESETS, STRING_PRESETS } from '@rally-strings/types'

interface CreateRequestDialogProps {
  stringer: StringerSearchResult
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateRequestDialog({ 
  stringer, 
  isOpen, 
  onOpenChange, 
  onSuccess 
}: CreateRequestDialogProps) {
  const [isRush, setIsRush] = useState(false)
  const queryClient = useQueryClient()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<CreateRequestFormData>({
    defaultValues: {
      dropoff_method: 'meetup'
    }
  })

  const dropoffMethod = watch('dropoff_method')

  const createRequestMutation = useMutation({
    mutationFn: async (data: CreateRequestFormData) => {
      const payload = {
        ...data,
        stringer_id: stringer.id,
        is_rush: isRush
      }

      const { data: result, error } = await supabase.functions.invoke('create-request', {
        body: payload
      })

      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
      reset()
      onSuccess()
    }
  })

  const calculatePrice = () => {
    let price = stringer.stringer_settings.base_price_cents
    if (isRush && stringer.stringer_settings.accepts_rush) {
      price += stringer.stringer_settings.rush_fee_cents
    }
    return price
  }

  const onSubmit = (data: CreateRequestFormData) => {
    createRequestMutation.mutate(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Restringing</DialogTitle>
          <DialogDescription>
            Create a restring request with {stringer.full_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Racquet Details */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Racquet Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand
                </label>
                <select
                  {...register('racquet_brand')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select brand</option>
                  {Array.from(new Set(['Babolat', 'Wilson', 'Head', 'Yonex', 'Prince', 'Tecnifibre'])).map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  {...register('racquet_model')}
                  placeholder="e.g., Pure Aero"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* String Details */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">String Preferences</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                String Type
              </label>
              <select
                {...register('string_pref')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select string type</option>
                {['Babolat RPM Blast 17', 'Luxilon ALU Power 16L', 'Wilson Natural Gut 16', 'Tecnifibre ATP Razor Code 17', 'Solinco Hyper-G 17', 'Head Hawk 17', 'Polyfibre Black Venom 16L', 'Babolat Xcel 16'].map(string => (
                  <option key={string} value={string}>{string}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tension (lbs)
              </label>
              <input
                type="number"
                min="30"
                max="80"
                step="0.5"
                {...register('tension_lbs', { 
                  valueAsNumber: true,
                  min: { value: 30, message: 'Minimum tension is 30 lbs' },
                  max: { value: 80, message: 'Maximum tension is 80 lbs' }
                })}
                placeholder="e.g., 55"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.tension_lbs && (
                <p className="text-red-600 text-sm mt-1">{errors.tension_lbs.message}</p>
              )}
            </div>
          </div>

          {/* Logistics */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Logistics</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Drop-off Method
              </label>
              <select
                {...register('dropoff_method')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="meetup">Meet up</option>
                <option value="pickup">Pickup from me</option>
                <option value="ship">Ship to stringer</option>
                <option value="dropbox">Drop box</option>
              </select>
            </div>

            {(dropoffMethod === 'meetup' || dropoffMethod === 'pickup' || dropoffMethod === 'dropbox') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address/Location
                </label>
                <input
                  type="text"
                  {...register('address')}
                  placeholder="Enter address or meeting location"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Any special requests or notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Rush Option */}
          {stringer.stringer_settings.accepts_rush && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="rush"
                checked={isRush}
                onChange={(e) => setIsRush(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="rush" className="text-sm font-medium text-gray-700">
                Rush service (+{formatPrice(stringer.stringer_settings.rush_fee_cents)})
              </label>
            </div>
          )}

          {/* Price Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Price:</span>
              <span className="text-xl font-bold text-primary">
                {formatPrice(calculatePrice())}
              </span>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Turnaround: {stringer.stringer_settings.turnaround_hours}h
              {isRush ? ' (rush)' : ''}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createRequestMutation.isPending}
            >
              {createRequestMutation.isPending ? 'Creating...' : 'Create Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
