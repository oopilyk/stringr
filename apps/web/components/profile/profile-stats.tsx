'use client'

import { Profile } from '@rally-strings/types'
import { Award, Target, Star, TrendingUp } from 'lucide-react'

interface ProfileStatsProps {
  profile: Profile & {
    years_experience?: number
    rackets_strung_count?: number
    certifications?: string[]
    profile_completion_percentage?: number
  }
}

export function ProfileStats({ profile }: ProfileStatsProps) {
  const stats = [
    {
      label: 'Rackets Strung',
      value: profile.rackets_strung_count || 0,
      icon: Target,
      show: (profile.rackets_strung_count || 0) > 0
    },
    {
      label: 'Years Experience',
      value: profile.years_experience || 0,
      icon: TrendingUp,
      show: (profile.years_experience || 0) > 0
    },
    {
      label: 'Certifications',
      value: profile.certifications?.length || 0,
      icon: Award,
      show: (profile.certifications?.length || 0) > 0
    },
    {
      label: 'Profile Complete',
      value: `${profile.profile_completion_percentage || 0}%`,
      icon: Star,
      show: true
    }
  ].filter(stat => stat.show)

  if (stats.length === 0) return null

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Stats</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
              <Icon className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          )
        })}
      </div>

      {/* Profile Completeness Bar */}
      {profile.profile_completion_percentage !== undefined && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Profile Completeness</span>
            <span className="text-sm font-bold text-primary">{profile.profile_completion_percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${profile.profile_completion_percentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
