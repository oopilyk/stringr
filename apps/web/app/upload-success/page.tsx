'use client'

import { Check } from 'lucide-react'

export default function UploadSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Photo Uploaded Successfully!</h1>
        <p className="text-gray-600 mb-6">
          Your completion photo has been uploaded. You can now close this page and return to your computer.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            The stringer can now mark this job as ready for pickup.
          </p>
        </div>
      </div>
    </div>
  )
}
