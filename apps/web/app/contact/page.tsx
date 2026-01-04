'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@stringerly/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@stringerly/ui'
import { ArrowLeft, MessageSquare, Bug, HelpCircle } from 'lucide-react'

export default function ContactPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('bug')
  const [message, setMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement contact form submission
    alert('Contact form not yet functional. Coming soon!')
  }

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
      <div className="max-w-4xl mx-auto px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Contact Us
          </h1>
          <p className="text-lg text-gray-600">
            Found a bug? Have a suggestion? We'd love to hear from you.
          </p>
        </div>

        {/* Contact Options */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <Bug className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Report a Bug</h3>
              <p className="text-sm text-gray-600">
                Help us improve by reporting issues
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <MessageSquare className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Feedback</h3>
              <p className="text-sm text-gray-600">
                Share your thoughts and ideas
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <HelpCircle className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Get Help</h3>
              <p className="text-sm text-gray-600">
                Need assistance? We're here to help
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle>Send us a message</CardTitle>
            <CardDescription>
              Fill out the form below and we'll get back to you as soon as possible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-900 mb-2">
                  Subject
                </label>
                <select
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="bug">Bug Report</option>
                  <option value="feedback">Feedback</option>
                  <option value="help">Need Help</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-900 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={6}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  placeholder="Tell us more about your issue or feedback..."
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <span className="font-semibold">Note:</span> This contact form is not yet functional.
                  We're working on implementing this feature. Check back soon!
                </p>
              </div>

              <Button type="submit" className="w-full h-12" disabled>
                Submit Request (Coming Soon)
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
