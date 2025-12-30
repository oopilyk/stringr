'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@stringr/ui'
import { Camera, Loader2, X } from 'lucide-react'
import Image from 'next/image'
import { RacketPhotoSchema, validateData } from '@/lib/validation/schemas'

interface RacketPhotoUploadProps {
  onUploadComplete: (url: string) => void
  initialPhotoUrl?: string
}

export function RacketPhotoUpload({ onUploadComplete, initialPhotoUrl }: RacketPhotoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPhotoUrl || null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // SECURITY: Validate file with Zod schema
    const validationResult = validateData(RacketPhotoSchema, { file })
    if (!validationResult.success) {
      setError(validationResult.error)
      return
    }

    // Additional security check: verify file extension matches MIME type
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp']
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
    if (!allowedExtensions.includes(fileExtension)) {
      setError('Invalid file extension. Use JPG, PNG, or WebP.')
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
      // SECURITY: Re-validate file before upload
      const validationResult = validateData(RacketPhotoSchema, { file: selectedFile })
      if (!validationResult.success) {
        throw new Error(validationResult.error)
      }

      // SECURITY: Verify user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Not authenticated')
      }

      // Generate unique filename with timestamp
      const fileExt = selectedFile.name.split('.').pop()
      const timestamp = Date.now()
      const fileName = `${user.id}/request-${timestamp}.${fileExt}`

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('racket_photos')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('racket_photos')
        .getPublicUrl(fileName)

      // Notify parent component
      onUploadComplete(publicUrl)

      // Keep preview but clear file
      setSelectedFile(null)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload photo')
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    setSelectedFile(null)
    setPreviewUrl(initialPhotoUrl || null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg overflow-hidden ${
          previewUrl ? 'border-gray-300' : 'border-gray-400'
        } ${!previewUrl && !selectedFile ? 'cursor-pointer hover:border-primary' : ''}`}
        onClick={() => !previewUrl && fileInputRef.current?.click()}
        style={{ minHeight: '200px' }}
      >
        {previewUrl ? (
          <div className="relative w-full h-64">
            <Image
              src={previewUrl}
              alt="Racket photo"
              fill
              className="object-contain"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500">
            <Camera className="w-12 h-12 mb-2" />
            <p className="text-sm font-medium">Tap to upload or take photo</p>
            <p className="text-xs mt-1">Clear photo showing the full racket</p>
          </div>
        )}
      </div>

      {/* Helper Text */}
      {!previewUrl && (
        <p className="text-sm text-gray-600">
          This helps your stringer prepare. Include the full racket, strings, and any visible wear.
        </p>
      )}

      {/* File Input (Hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Actions */}
      {selectedFile && !isUploading && (
        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="flex-1"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              'Confirm Photo'
            )}
          </Button>
          <Button
            onClick={handleCancel}
            disabled={isUploading}
            variant="outline"
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
        </div>
      )}

      {previewUrl && !selectedFile && (
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          className="w-full"
        >
          <Camera className="w-4 h-4 mr-2" />
          Change Photo
        </Button>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Requirements */}
      {!selectedFile && !previewUrl && (
        <p className="text-xs text-gray-500 text-center">
          JPG, PNG or WEBP. Max 5MB.
        </p>
      )}
    </div>
  )
}
