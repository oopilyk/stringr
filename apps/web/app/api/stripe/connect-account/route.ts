import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createConnectedAccount, createConnectAccountLink } from '@/lib/stripe/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to get email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check if user is a stringer
    const { data: stringerSettings, error: stringerError } = await supabase
      .from('stringer_settings')
      .select('*')
      .eq('id', user.id)
      .single()

    if (stringerError || !stringerSettings) {
      return NextResponse.json({ error: 'Stringer profile not found' }, { status: 404 })
    }

    // Check if already has Stripe account
    if (stringerSettings.stripe_account_id) {
      return NextResponse.json({
        error: 'Stripe account already exists',
        accountId: stringerSettings.stripe_account_id
      }, { status: 400 })
    }

    // Create Stripe Connected Account
    const account = await createConnectedAccount(user.email || profile.email || '')

    // Save account ID to database
    const { error: updateError } = await supabase
      .from('stringer_settings')
      .update({
        stripe_account_id: account.id,
        stripe_onboarding_completed: false,
        stripe_charges_enabled: false,
        stripe_payouts_enabled: false,
      })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to save Stripe account' }, { status: 500 })
    }

    // Create account link for onboarding
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const returnUrl = `${origin}/settings?stripe_onboarding=success`
    const refreshUrl = `${origin}/settings?stripe_onboarding=refresh`

    const accountLink = await createConnectAccountLink(account.id, returnUrl, refreshUrl)

    return NextResponse.json({
      accountId: account.id,
      onboardingUrl: accountLink.url,
    })
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error)
    return NextResponse.json(
      { error: 'Failed to create Stripe account' },
      { status: 500 }
    )
  }
}

// Get existing account status
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: stringerSettings } = await supabase
      .from('stringer_settings')
      .select('stripe_account_id, stripe_onboarding_completed, stripe_charges_enabled, stripe_payouts_enabled')
      .eq('id', user.id)
      .single()

    if (!stringerSettings?.stripe_account_id) {
      return NextResponse.json({ connected: false })
    }

    return NextResponse.json({
      connected: true,
      accountId: stringerSettings.stripe_account_id,
      onboardingCompleted: stringerSettings.stripe_onboarding_completed,
      chargesEnabled: stringerSettings.stripe_charges_enabled,
      payoutsEnabled: stringerSettings.stripe_payouts_enabled,
    })
  } catch (error) {
    console.error('Error fetching Stripe account:', error)
    return NextResponse.json({ error: 'Failed to fetch account' }, { status: 500 })
  }
}
