'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { Navigation } from '@/components/layout/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button } from '@rally-strings/ui'
import { Settings as SettingsIcon, Save, CreditCard, Lock, User } from 'lucide-react'

export default function SettingsPage() {
  const { profile } = useAuth()
  const [message, setMessage] = useState('')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <SettingsIcon className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-lg text-gray-600">
            Manage your account preferences and app settings.
          </p>
        </div>

        {/* Account Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              <User className="inline w-5 h-5 mr-2 text-primary" />
              Account Info
            </CardTitle>
            <CardDescription>
              View your account details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profile?.full_name || ''}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Change email</label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  placeholder="Enter email to send verification"
                  className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              <Lock className="inline w-5 h-5 mr-2 text-primary" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your account password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  className="w-full px-3 py-2 border rounded-lg"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 border rounded-lg"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2 border rounded-lg"
                  disabled
                />
              </div>
              <Button disabled>
                <Save className="w-4 h-4 mr-2" />
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payment Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              <CreditCard className="inline w-5 h-5 mr-2 text-primary" />
              Payment Info
            </CardTitle>
            <CardDescription>
              Manage your saved payment methods.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                <input
                  type="text"
                  placeholder="**** **** **** 1234"
                  className="w-full px-3 py-2 border rounded-lg"
                  disabled
                />
              </div>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                  <input
                    type="text"
                    placeholder="CVC"
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled
                  />
                </div>
              </div>
              <Button disabled>
                <Save className="w-4 h-4 mr-2" />
                Update Payment Info
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Demo message */}
        <div className="text-center text-gray-400 text-sm mt-8">
          This is a demo settings page. Functionality coming soon.
        </div>
      </main>
    </div>
  )
}