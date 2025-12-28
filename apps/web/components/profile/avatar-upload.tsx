'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@stringr/ui'
import { Camera, Loader2, X } from 'lucide-react'
import Image from 'next/image'

interface AvatarUploadProps {
  userId: string
  currentAvatarUrl?: string | null
  onUploadComplete: (url: string) => void
  size?: number
}

export function AvatarUpload({ userId, currentAvatarUrl, onUploadComplete, size = 128 }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    setError(null)
    setSelectedFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setError(null)

    try {
      // Generate unique filename
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${userId}/avatar.${fileExt}`

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) {
        throw updateError
      }

      // Notify parent component
      onUploadComplete(publicUrl)

      // Reset state
      setSelectedFile(null)
      setPreviewUrl(null)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload avatar')
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const displayUrl = previewUrl || currentAvatarUrl

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar Display */}
      <div
        className="relative group cursor-pointer"
        onClick={() => !selectedFile && fileInputRef.current?.click()}
        style={{ width: size, height: size }}
      >
        {displayUrl ? (
          <Image
            src={displayUrl}
            alt="Profile avatar"
            width={size}
            height={size}
            className="rounded-full object-cover border-4 border-gray-200"
            style={{ objectPosition: 'center', aspectRatio: '1/1' }}
          />
        ) : (
          <div
            className="rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center border-4 border-gray-200"
            style={{ width: size, height: size }}
          >
            <span className="text-white text-4xl font-bold">
              {userId.substring(0, 2).toUpperCase()}
            </span>
          </div>
        )}

        {/* Camera Overlay */}
        {!selectedFile && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-8 h-8 text-white" />
          </div>
        )}
      </div>

      {/* File Input (Hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Actions */}
      {selectedFile ? (
        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            size="sm"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              'Save Photo'
            )}
          </Button>
          <Button
            onClick={handleCancel}
            disabled={isUploading}
            variant="outline"
            size="sm"
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          size="sm"
        >
          <Camera className="w-4 h-4 mr-2" />
          Change Photo
        </Button>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* File Requirements */}
      {!selectedFile && (
        <p className="text-xs text-gray-500 text-center">
          JPG, PNG or WEBP. Max 5MB.
        </p>
      )}
    </div>
  )
}
