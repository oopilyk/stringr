'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@stringerly/ui'
import { ArrowLeft } from 'lucide-react'

export default function AboutPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* Navigation Bar */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-4 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="flex items-center space-x-3">
          <img
            src="/logo.jpg"
            alt="Stringerly Logo"
            width={48}
            height={48}
            className="rounded-full object-cover"
          />
          <span className="text-2xl font-bold text-primary">STRINGERLY</span>
        </div>

        <Button
          variant="outline"
          className="border-primary text-primary hover:bg-primary/10"
          onClick={() => router.push('/auth/signin')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            About the Creators
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Meet the Johns Hopkins University students behind Stringerly
          </p>
        </div>

        {/* Creators Grid */}
        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Owen Akers */}
          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="flex flex-col items-center">
              <div className="w-48 h-48 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full mb-6 flex items-center justify-center">
                <span className="text-6xl font-bold text-white">OA</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Owen Akers</h2>
              <p className="text-primary font-medium mb-4">Co-Founder</p>
              <div className="w-full">
                <p className="text-gray-600 leading-relaxed mb-4">
                  Owen is a student at Johns Hopkins University with a passion for tennis and technology.
                </p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><span className="font-semibold">School:</span> Johns Hopkins University</p>
                  <p><span className="font-semibold">Role:</span> Co-Founder & Developer</p>
                  <p><span className="font-semibold">Interests:</span> Tennis, Software Engineering, Entrepreneurship</p>
                </div>
              </div>
            </div>
          </div>

          {/* Kyle Li */}
          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="flex flex-col items-center">
              <div className="w-48 h-48 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full mb-6 flex items-center justify-center">
                <span className="text-6xl font-bold text-white">KL</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Kyle Li</h2>
              <p className="text-primary font-medium mb-4">Co-Founder</p>
              <div className="w-full">
                <p className="text-gray-600 leading-relaxed mb-4">
                  Kyle is a student at Johns Hopkins University with a passion for tennis and innovation.
                </p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><span className="font-semibold">School:</span> Johns Hopkins University</p>
                  <p><span className="font-semibold">Role:</span> Co-Founder & Developer</p>
                  <p><span className="font-semibold">Interests:</span> Tennis, Product Design, Technology</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mission Statement */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Our Mission</h3>
          <p className="text-gray-600 leading-relaxed text-center">
            We created Stringerly to solve a common problem in the tennis community: finding reliable,
            quality stringers. As tennis players ourselves, we understand the importance of having
            your racket strung correctly. Stringerly connects players with certified stringers, making
            it easier than ever to maintain your equipment and focus on your game.
          </p>
        </div>
      </div>
    </div>
  )
}
