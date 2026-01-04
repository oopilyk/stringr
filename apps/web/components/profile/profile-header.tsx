'use client'

import { Profile } from '@stringerly/types'
import { AvatarUpload } from './avatar-upload'
import { Star, MapPin, Edit, LogOut } from 'lucide-react'
import { Button } from '@stringerly/ui'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface ProfileHeaderProps {
  profile: Profile
  averageRating?: number
  reviewCount?: number
  isOwnProfile?: boolean
  onAvatarChange: (url: string) => void
  userEmail?: string
}

export function ProfileHeader({
  profile,
  averageRating = 0,
  reviewCount = 0,
  isOwnProfile = false,
  onAvatarChange,
  userEmail
}: ProfileHeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

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
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center border-4 border-gray-200 overflow-hidden">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || 'User'}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-4xl font-bold">
                {(profile.full_name || userEmail || 'U')?.substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>
        )}

        {/* Profile Info */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {profile.full_name || 'Anonymous User'}
            </h1>
            {isOwnProfile && (
              <Link href="/auth/stringer-signup">
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

      {/* Sign Out Button - Only shown for own profile */}
      {isOwnProfile && (
        <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-gray-600 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      )}
    </div>
  )
}
