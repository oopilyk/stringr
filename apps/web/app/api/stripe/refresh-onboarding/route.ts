import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createConnectAccountLink, getConnectedAccountDetails } from '@/lib/stripe/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: stringerSettings } = await supabase
      .from('stringer_settings')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single()

    if (!stringerSettings?.stripe_account_id) {
      return NextResponse.json({ error: 'No Stripe account found' }, { status: 404 })
    }

    // Get account details from Stripe
    const accountDetails = await getConnectedAccountDetails(stringerSettings.stripe_account_id)

    // Update database with latest status
    await supabase
      .from('stringer_settings')
      .update({
        stripe_onboarding_completed: accountDetails.detailsSubmitted,
        stripe_charges_enabled: accountDetails.chargesEnabled,
        stripe_payouts_enabled: accountDetails.payoutsEnabled,
      })
      .eq('id', user.id)

    // If not completed, create new account link
    if (!accountDetails.detailsSubmitted) {
      const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const returnUrl = `${origin}/settings?stripe_onboarding=success`
      const refreshUrl = `${origin}/settings?stripe_onboarding=refresh`

      const accountLink = await createConnectAccountLink(
        stringerSettings.stripe_account_id,
        returnUrl,
        refreshUrl
      )

      return NextResponse.json({
        onboardingUrl: accountLink.url,
        completed: false,
      })
    }

    return NextResponse.json({
      completed: true,
      chargesEnabled: accountDetails.chargesEnabled,
      payoutsEnabled: accountDetails.payoutsEnabled,
    })
  } catch (error) {
    console.error('Error refreshing Stripe onboarding:', error)
    return NextResponse.json({ error: 'Failed to refresh onboarding' }, { status: 500 })
  }
}
