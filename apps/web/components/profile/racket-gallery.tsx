'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@stringerly/ui'
import { Camera, Loader2, X, Plus, Trash2, Edit2 } from 'lucide-react'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@stringerly/ui'
import { Input } from '@stringerly/ui'
import { Textarea } from '@stringerly/ui'
import { Label } from '@stringerly/ui'

interface GalleryImage {
  id: string
  stringer_id: string
  image_url: string
  caption: string | null
  racquet_brand: string | null
  racquet_model: string | null
  string_used: string | null
  tension_lbs: number | null
  display_order: number
  created_at: string
  updated_at: string
}

interface RacketGalleryProps {
  stringerId: string
  isOwnProfile: boolean
}

export function RacketGallery({ stringerId, isOwnProfile }: RacketGalleryProps) {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [viewingImage, setViewingImage] = useState<GalleryImage | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Form state
  const [caption, setCaption] = useState('')
  const [racquetBrand, setRacquetBrand] = useState('')
  const [racquetModel, setRacquetModel] = useState('')
  const [stringUsed, setStringUsed] = useState('')
  const [tension, setTension] = useState('')

  // Load gallery images
  useEffect(() => {
    loadGalleryImages()
  }, [stringerId])

  const loadGalleryImages = async () => {
    try {
      const { data, error } = await supabase
        .from('racket_gallery')
        .select('*')
        .eq('stringer_id', stringerId)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) throw error
      setImages(data || [])
    } catch (err) {
      console.error('Error loading gallery:', err)
    } finally {
      setIsLoading(false)
    }
  }

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
      const fileName = `${stringerId}/${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('racket-gallery')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('racket-gallery')
        .getPublicUrl(fileName)

      // Insert gallery record
      const { error: insertError } = await supabase
        .from('racket_gallery')
        .insert({
          stringer_id: stringerId,
          image_url: publicUrl,
          caption: caption || null,
          racquet_brand: racquetBrand || null,
          racquet_model: racquetModel || null,
          string_used: stringUsed || null,
          tension_lbs: tension ? parseFloat(tension) : null,
          display_order: images.length,
        })

      if (insertError) throw insertError

      // Reload gallery
      await loadGalleryImages()

      // Reset form
      resetForm()
      setIsDialogOpen(false)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (imageId: string, imageUrl: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return

    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/racket-gallery/')
      const filePath = urlParts[1]

      // Delete from storage
      await supabase.storage
        .from('racket-gallery')
        .remove([filePath])

      // Delete from database
      const { error } = await supabase
        .from('racket_gallery')
        .delete()
        .eq('id', imageId)

      if (error) throw error

      // Reload gallery
      await loadGalleryImages()
    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete image')
    }
  }

  const resetForm = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setCaption('')
    setRacquetBrand('')
    setRacquetModel('')
    setStringUsed('')
    setTension('')
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Racket Gallery</h3>
        {isOwnProfile && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Photo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Racket Photo</DialogTitle>
                <DialogDescription>
                  Upload a photo of a racket you've strung to showcase your work
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Image Preview */}
                {previewUrl ? (
                  <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      onClick={() => {
                        setSelectedFile(null)
                        setPreviewUrl(null)
                      }}
                      className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors flex flex-col items-center justify-center gap-2 bg-gray-50"
                  >
                    <Camera className="w-12 h-12 text-gray-400" />
                    <span className="text-sm text-gray-600">Click to upload photo</span>
                    <span className="text-xs text-gray-500">JPG, PNG or WEBP. Max 5MB</span>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Form Fields */}
                {selectedFile && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="caption">Caption (optional)</Label>
                      <Textarea
                        id="caption"
                        value={caption}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCaption(e.target.value)}
                        placeholder="Describe this stringing job..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="brand">Racket Brand</Label>
                        <Input
                          id="brand"
                          value={racquetBrand}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRacquetBrand(e.target.value)}
                          placeholder="e.g. Wilson"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="model">Racket Model</Label>
                        <Input
                          id="model"
                          value={racquetModel}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRacquetModel(e.target.value)}
                          placeholder="e.g. Pro Staff"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="string">String Used</Label>
                        <Input
                          id="string"
                          value={stringUsed}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStringUsed(e.target.value)}
                          placeholder="e.g. RPM Blast"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tension">Tension (lbs)</Label>
                        <Input
                          id="tension"
                          type="number"
                          step="0.5"
                          min="30"
                          max="80"
                          value={tension}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTension(e.target.value)}
                          placeholder="e.g. 55"
                        />
                      </div>
                    </div>

                    {error && (
                      <p className="text-sm text-red-600">{error}</p>
                    )}

                    <div className="flex gap-2 pt-2">
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
                          'Upload Photo'
                        )}
                      </Button>
                      <Button
                        onClick={() => setIsDialogOpen(false)}
                        disabled={isUploading}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Gallery Grid */}
      {images.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {isOwnProfile ? (
            <div className="space-y-2">
              <Camera className="w-12 h-12 mx-auto text-gray-300" />
              <p>No photos yet</p>
              <p className="text-sm">Add photos to showcase your stringing work</p>
            </div>
          ) : (
            <p>No photos available</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div key={image.id} className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100">
              <button
                onClick={() => setViewingImage(image)}
                className="w-full h-full relative"
              >
                <Image
                  src={image.image_url}
                  alt={image.caption || 'Racket photo'}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />

                {/* Always visible caption overlay at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none">
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    {image.caption && (
                      <p className="text-sm font-medium line-clamp-2 mb-1">{image.caption}</p>
                    )}
                    {image.tension_lbs && (
                      <p className="text-xs opacity-90 font-semibold">{image.tension_lbs} lbs</p>
                    )}
                  </div>
                </div>
              </button>

              {/* Delete button for own profile */}
              {isOwnProfile && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(image.id, image.image_url)
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 z-10"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Image Detail Modal */}
      {viewingImage && (
        <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Racket Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative w-full h-[400px] rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={viewingImage.image_url}
                  alt={viewingImage.caption || 'Racket photo'}
                  fill
                  className="object-contain"
                />
              </div>

              <div className="space-y-3">
                {viewingImage.caption && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">Details</h4>
                    <p className="text-base text-gray-900">{viewingImage.caption}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {(viewingImage.racquet_brand || viewingImage.racquet_model) && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">Racket</h4>
                      <p className="text-base text-gray-900">
                        {[viewingImage.racquet_brand, viewingImage.racquet_model].filter(Boolean).join(' ')}
                      </p>
                    </div>
                  )}

                  {viewingImage.string_used && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">String</h4>
                      <p className="text-base text-gray-900">{viewingImage.string_used}</p>
                    </div>
                  )}

                  {viewingImage.tension_lbs && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">Tension</h4>
                      <p className="text-base text-gray-900">{viewingImage.tension_lbs} lbs</p>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">Date</h4>
                    <p className="text-base text-gray-900">
                      {new Date(viewingImage.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  onClick={() => setViewingImage(null)}
                >
                  Back to Profile
                </Button>
                <div className="flex gap-2">
                  {isOwnProfile && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleDelete(viewingImage.id, viewingImage.image_url)
                        setViewingImage(null)
                      }}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
