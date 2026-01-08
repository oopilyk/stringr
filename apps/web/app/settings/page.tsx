'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { Navigation } from '@/components/layout/navigation'
import { ConnectOnboarding } from '@/components/stripe/connect-onboarding'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
} from '@stringerly/ui'
import { Save, CreditCard, Lock, User } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export default function SettingsPage() {
  const { user, profile } = useAuth()
  const [message] = useState('')
  const [isStringer, setIsStringer] = useState(false)

  useEffect(() => {
    const checkIfStringer = async () => {
      if (!user) return

      const supabase = createClient()
      const { data } = await supabase
        .from('stringer_settings')
        .select('id')
        .eq('id', user.id)
        .single()

      setIsStringer(!!data)
    }

    checkIfStringer()
  }, [user])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your personal information, password, and payment methods.
          </p>
        </div>

        {/* Account Info */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={profile?.full_name || ''}
                disabled
                className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700"
              />
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lock className="w-4 h-4 text-muted-foreground" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your account password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                placeholder="Enter current password"
                disabled
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                placeholder="Enter new password"
                disabled
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="Confirm new password"
                disabled
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
            <Button disabled className="mt-3">
              <Save className="w-4 h-4 mr-2" />
              Change Password
            </Button>
          </CardContent>
        </Card>

        {/* Payment Info */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              Payment Information
            </CardTitle>
            <CardDescription>
              Manage your saved payment methods.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Number
              </label>
              <input
                type="text"
                placeholder="**** **** **** 1234"
                disabled
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry
                </label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVC
                </label>
                <input
                  type="text"
                  placeholder="CVC"
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
            </div>
            <Button disabled>
              <Save className="w-4 h-4 mr-2" />
              Update Payment Info
            </Button>
          </CardContent>
        </Card>

        {/* Stripe Connect - Only for Stringers */}
        {isStringer && user && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Settings</h2>
            <ConnectOnboarding userId={user.id} />
          </div>
        )}

        {/* Demo note */}
        {!isStringer && (
          <p className="text-center text-gray-400 text-sm mt-12 italic">
            This is a demo settings page — functionality coming soon.
          </p>
        )}
      </main>
    </div>
  )
}