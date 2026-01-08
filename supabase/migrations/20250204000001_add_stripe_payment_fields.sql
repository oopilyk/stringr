-- Add payment fields to requests table
ALTER TABLE requests ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS payment_authorized_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS payment_captured_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS platform_fee_cents INTEGER DEFAULT 0;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS stringer_earnings_cents INTEGER DEFAULT 0;

-- Add Stripe Connect fields to stringer_settings table
ALTER TABLE stringer_settings ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
ALTER TABLE stringer_settings ADD COLUMN IF NOT EXISTS stripe_onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE stringer_settings ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE stringer_settings ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT FALSE;

-- Create index for faster payment intent lookups
CREATE INDEX IF NOT EXISTS idx_requests_payment_intent ON requests(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_stringer_settings_stripe_account ON stringer_settings(stripe_account_id);

-- Add comment for documentation
COMMENT ON COLUMN requests.payment_intent_id IS 'Stripe Payment Intent ID for this job';
COMMENT ON COLUMN requests.payment_authorized_at IS 'When payment was authorized (held) on player card';
COMMENT ON COLUMN requests.payment_captured_at IS 'When payment was captured and transferred to stringer';
COMMENT ON COLUMN requests.platform_fee_cents IS 'Stringerly platform fee in cents (12% of quoted price)';
COMMENT ON COLUMN requests.stringer_earnings_cents IS 'What the stringer earns after platform fee (before Stripe fees)';
COMMENT ON COLUMN stringer_settings.stripe_account_id IS 'Stripe Connect Account ID for receiving payments';
COMMENT ON COLUMN stringer_settings.stripe_onboarding_completed IS 'Whether stringer completed Stripe onboarding';
COMMENT ON COLUMN stringer_settings.stripe_charges_enabled IS 'Whether Stripe account can receive charges';
COMMENT ON COLUMN stringer_settings.stripe_payouts_enabled IS 'Whether Stripe account can receive payouts';
