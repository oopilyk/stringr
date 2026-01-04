'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@stringerly/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@stringerly/ui'
import { ArrowLeft, Check } from 'lucide-react'

export default function PricingPage() {
  const router = useRouter()

  const pricingTiers = [
    {
      name: 'Basic Stringer',
      price: '$15-25',
      description: 'Entry-level stringers with basic certification',
      features: [
        'Standard tension accuracy',
        '24-48 hour turnaround',
        'Basic string selection',
        'Quality guaranteed'
      ]
    },
    {
      name: 'Professional Stringer',
      price: '$25-40',
      description: 'Experienced stringers with advanced certification',
      features: [
        'High precision tension',
        'Same-day service available',
        'Wide string selection',
        'String recommendations',
        'Racket inspection included'
      ],
      popular: true
    },
    {
      name: 'Master Stringer',
      price: '$40-60',
      description: 'Elite stringers with master certification',
      features: [
        'Tournament-grade precision',
        'Express service (2-4 hours)',
        'Premium string brands',
        'Custom tension mapping',
        'Full racket analysis',
        'Personalized consultation'
      ]
    }
  ]

  const commonJobs = [
    { service: 'Standard Stringing', price: '$20-30' },
    { service: 'Hybrid Stringing', price: '$25-40' },
    { service: 'String + Grip Replacement', price: '$30-45' },
    { service: 'Racket Customization', price: '$50-100' },
    { service: 'Tournament Rush Service', price: '+$15-25' }
  ]

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
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Pricing
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Transparent pricing for quality stringing services. Find the right stringer for your needs and budget.
          </p>
        </div>

        {/* Stringer Tiers */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Average Stringer Pricing
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {pricingTiers.map((tier) => (
              <Card
                key={tier.name}
                className={`relative ${
                  tier.popular
                    ? 'border-2 border-primary shadow-xl scale-105'
                    : 'hover:shadow-lg transition-shadow'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl mb-2">{tier.name}</CardTitle>
                  <div className="text-4xl font-bold text-primary mb-2">
                    {tier.price}
                  </div>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <Check className="w-5 h-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Common Services */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Typical Service Pricing
          </h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {commonJobs.map((job, index) => (
                  <div
                    key={job.service}
                    className={`flex justify-between items-center py-3 ${
                      index !== commonJobs.length - 1 ? 'border-b border-gray-200' : ''
                    }`}
                  >
                    <span className="text-gray-900 font-medium">{job.service}</span>
                    <span className="text-primary font-semibold">{job.price}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Note:</span> Prices vary by stringer experience,
                  location, and string type. Premium strings may incur additional costs.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Button
            size="lg"
            className="h-12 px-8"
            onClick={() => router.push('/auth/signup')}
          >
            Get Started with Stringerly
          </Button>
        </div>
      </div>
    </div>
  )
}
