'use client'

import { UseFormGetValues } from 'react-hook-form'
import { StringerOnboardingData } from '@stringr/types'
import { Card, Button } from '@stringr/ui'
import { Edit, Check } from 'lucide-react'
import { calculateProfileCompleteness, getCompletenessMessage, getCompletionColor } from '@/lib/utils/profile-completeness'
import { formatPrice } from '@stringr/ui'

interface Step7ReviewProps {
  getValues: UseFormGetValues<StringerOnboardingData>
  jumpToStep: (step: number) => void
}

export function Step7Review({ getValues, jumpToStep }: Step7ReviewProps) {
  const data = getValues()
  const completeness = calculateProfileCompleteness(data)
  const completenessMessage = getCompletenessMessage(completeness)
  const completenessColor = getCompletionColor(completeness)

  return (
    <div className="space-y-6">
      {/* Completeness Badge */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Profile Completeness</h3>
          <span className={`text-3xl font-bold ${completenessColor}`}>{completeness}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div
            className="bg-primary h-3 rounded-full transition-all"
            style={{ width: `${completeness}%` }}
          />
        </div>
        <p className="text-sm text-gray-700">{completenessMessage}</p>
      </div>

      {/* Section 1: Credentials & Location */}
      <Card className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="font-semibold text-gray-900">Credentials & Location</h4>
            <p className="text-xs text-gray-500">Step 1</p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => jumpToStep(1)}>
            <Edit className="w-3 h-3 mr-1" />
            Edit
          </Button>
        </div>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <dt className="text-gray-500">Email</dt>
            <dd className="font-medium text-gray-900">{data.email || '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Full Name</dt>
            <dd className="font-medium text-gray-900">{data.full_name || '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Phone</dt>
            <dd className="font-medium text-gray-900">{data.phone || '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">City</dt>
            <dd className="font-medium text-gray-900">{data.city || '—'}</dd>
          </div>
        </dl>
      </Card>

      {/* Section 2: Background & Experience */}
      <Card className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="font-semibold text-gray-900">Background & Experience</h4>
            <p className="text-xs text-gray-500">Step 2</p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => jumpToStep(2)}>
            <Edit className="w-3 h-3 mr-1" />
            Edit
          </Button>
        </div>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <dt className="text-gray-500">Years Experience</dt>
            <dd className="font-medium text-gray-900">{data.years_experience ? `${data.years_experience}+ years` : '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Rackets Strung</dt>
            <dd className="font-medium text-gray-900">{data.rackets_strung_count || '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Certifications</dt>
            <dd className="font-medium text-gray-900">
              {data.certifications && data.certifications.length > 0 ? data.certifications.join(', ') : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Stringing Location</dt>
            <dd className="font-medium text-gray-900">{data.stringing_location || '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Player Levels</dt>
            <dd className="font-medium text-gray-900">
              {data.player_levels_served && data.player_levels_served.length > 0 ? data.player_levels_served.join(', ') : '—'}
            </dd>
          </div>
          {data.bio && (
            <div className="md:col-span-2">
              <dt className="text-gray-500">Bio</dt>
              <dd className="font-medium text-gray-900 mt-1">{data.bio}</dd>
            </div>
          )}
        </dl>
      </Card>

      {/* Section 3: Equipment */}
      <Card className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="font-semibold text-gray-900">Equipment & Capabilities</h4>
            <p className="text-xs text-gray-500">Step 3</p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => jumpToStep(3)}>
            <Edit className="w-3 h-3 mr-1" />
            Edit
          </Button>
        </div>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <dt className="text-gray-500">Machine Brand</dt>
            <dd className="font-medium text-gray-900">{data.machine_brand || '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Machine Model</dt>
            <dd className="font-medium text-gray-900">{data.machine_model || '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Machine Type</dt>
            <dd className="font-medium text-gray-900 capitalize">{data.machine_type?.replace('-', ' ') || '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Max Tension</dt>
            <dd className="font-medium text-gray-900">{data.max_tension ? `${data.max_tension} lbs` : '—'}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="text-gray-500">Supported Racket Types</dt>
            <dd className="font-medium text-gray-900">
              {data.supported_racket_types && data.supported_racket_types.length > 0 ? data.supported_racket_types.join(', ') : '—'}
            </dd>
          </div>
        </dl>
      </Card>

      {/* Section 4: Pricing */}
      <Card className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="font-semibold text-gray-900">Pricing & Turnaround</h4>
            <p className="text-xs text-gray-500">Step 4</p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => jumpToStep(4)}>
            <Edit className="w-3 h-3 mr-1" />
            Edit
          </Button>
        </div>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <dt className="text-gray-500">Base Price</dt>
            <dd className="font-medium text-gray-900 text-lg text-primary">{formatPrice(data.base_price_cents || 0)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Turnaround</dt>
            <dd className="font-medium text-gray-900">{data.turnaround_hours || 0}h</dd>
          </div>
          <div>
            <dt className="text-gray-500">Rush Service</dt>
            <dd className="font-medium text-gray-900">
              {data.accepts_rush ? `Yes (+${formatPrice(data.rush_fee_cents || 0)})` : 'No'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Bulk Discount</dt>
            <dd className="font-medium text-gray-900">{data.discount_bulk_jobs ? `${data.discount_bulk_jobs}%` : '—'}</dd>
          </div>
          {data.pricing_notes && (
            <div className="md:col-span-2">
              <dt className="text-gray-500">Pricing Notes</dt>
              <dd className="font-medium text-gray-900 mt-1">{data.pricing_notes}</dd>
            </div>
          )}
        </dl>
      </Card>

      {/* Section 5: Inventory */}
      <Card className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="font-semibold text-gray-900">String Inventory</h4>
            <p className="text-xs text-gray-500">Step 5</p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => jumpToStep(5)}>
            <Edit className="w-3 h-3 mr-1" />
            Edit
          </Button>
        </div>
        {data.string_inventory && data.string_inventory.length > 0 ? (
          <div className="space-y-2">
            {data.string_inventory.map((item, idx) => (
              <div key={idx} className="text-sm flex justify-between items-center py-1 border-b last:border-0">
                <span className="font-medium">
                  {item.brand} {item.model} ({item.gauge})
                </span>
                <span className="text-gray-600">
                  Qty: {item.quantity} • {formatPrice(item.price_cents)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No string inventory added</p>
        )}
        <div className="mt-3 pt-3 border-t">
          <p className="text-sm">
            <span className="text-gray-500">Accept player-provided strings:</span>{' '}
            <span className="font-medium">{data.accepts_player_strings ? 'Yes' : 'No'}</span>
          </p>
        </div>
      </Card>

      {/* Section 6: Availability */}
      <Card className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="font-semibold text-gray-900">Availability & Preferences</h4>
            <p className="text-xs text-gray-500">Step 6</p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => jumpToStep(6)}>
            <Edit className="w-3 h-3 mr-1" />
            Edit
          </Button>
        </div>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-gray-500">Dropoff Methods</dt>
            <dd className="font-medium text-gray-900">
              {data.dropoff_methods && data.dropoff_methods.length > 0
                ? data.dropoff_methods.map((m) => m.method).join(', ')
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Weekly Availability</dt>
            <dd className="font-medium text-gray-900">
              {data.availability && data.availability.length > 0 ? `${data.availability.length} time slots configured` : 'Not set'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Max Daily Jobs</dt>
            <dd className="font-medium text-gray-900">{data.max_daily_jobs || '—'}</dd>
          </div>
        </dl>
      </Card>

      {/* Terms & Conditions */}
      <div className="border-t pt-6">
        <label className="flex items-start">
          <input type="checkbox" required className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary mt-0.5" />
          <span className="ml-3 text-sm text-gray-700">
            I agree to the{' '}
            <a href="#" className="text-primary hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-primary hover:underline">
              Privacy Policy
            </a>
            . I confirm that the information provided is accurate and I'm authorized to provide stringing services.
          </span>
        </label>
      </div>

      {/* Completion Message */}
      {completeness >= 90 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-green-900">Ready to go live!</h4>
            <p className="text-sm text-green-700 mt-1">
              Your profile is complete and ready to start receiving requests from players. Click "Complete Registration" below to
              finish setup.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
