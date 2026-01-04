'use client'

import { useState, useRef } from 'react'
import { Button } from '@stringerly/ui'
import { Camera, Upload, Check, Loader2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'

export default function UploadPhotoPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      setUploading(true)

      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('token', token)

      const response = await fetch('/api/upload-completion-photo', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        setUploaded(true)
        setTimeout(() => {
          router.push('/upload-success')
        }, 1500)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to upload photo')
      }
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Completion Photo</h1>
          <p className="text-sm text-gray-600">
            Take a photo of the finished racket to complete this job
          </p>
        </div>

        {!uploaded ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            {previewUrl ? (
              <div className="mb-6">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
                />
                <Button
                  variant="outline"
                  className="w-full mt-3"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Another Photo
                </Button>
              </div>
            ) : (
              <Button
                className="w-full h-48 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white mb-4"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-center">
                  <Camera className="w-12 h-12 mx-auto mb-2" />
                  <span className="text-lg font-semibold">Take Photo</span>
                </div>
              </Button>
            )}

            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Photo
                </>
              )}
            </Button>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Photo Uploaded!</h2>
            <p className="text-gray-600">You can now close this page</p>
          </div>
        )}
      </div>
    </div>
  )
}
