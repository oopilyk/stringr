'use client'

import { Profile } from '@stringr/types'
import { AvatarUpload } from './avatar-upload'
import { Star, MapPin, Edit } from 'lucide-react'
import { Button } from '@stringr/ui'
import Link from 'next/link'

interface ProfileHeaderProps {
  profile: Profile
  averageRating?: number
  reviewCount?: number
  isOwnProfile?: boolean
  onAvatarChange: (url: string) => void
}

export function ProfileHeader({
  profile,
  averageRating = 0,
  reviewCount = 0,
  isOwnProfile = false,
  onAvatarChange
}: ProfileHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        {/* Avatar */}
        {isOwnProfile ? (
          <AvatarUpload
            userId={profile.id}
            currentAvatarUrl={profile.avatar_url}
            onUploadComplete={onAvatarChange}
            size={128}
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center border-4 border-gray-200">
            <span className="text-white text-4xl font-bold">
              {(profile.full_name || profile.email)?.substring(0, 2).toUpperCase()}
            </span>
          </div>
        )}

        {/* Profile Info */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {profile.full_name || 'Anonymous User'}
            </h1>
            {isOwnProfile && (
              <Link href="/my-profile/edit">
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>
            )}
          </div>

          {/* Rating & Location */}
          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 text-gray-600 mb-2">
            {reviewCount > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{averageRating.toFixed(1)}</span>
                <span className="text-sm">({reviewCount} reviews)</span>
              </div>
            )}
            {profile.city && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{profile.city}</span>
              </div>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-gray-700 mt-3 max-w-2xl">
              {profile.bio}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
