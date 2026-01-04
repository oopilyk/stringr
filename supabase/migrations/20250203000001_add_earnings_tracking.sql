-- Migration: Add earnings tracking to stringer_settings
-- Created: 2025-02-03

-- Add total earnings field to track all completed job payments
ALTER TABLE public.stringer_settings
ADD COLUMN IF NOT EXISTS total_earnings_cents BIGINT DEFAULT 0 NOT NULL;

-- Add constraint to ensure earnings are never negative
ALTER TABLE public.stringer_settings
ADD CONSTRAINT total_earnings_non_negative CHECK (total_earnings_cents >= 0);

-- Add comment for documentation
COMMENT ON COLUMN public.stringer_settings.total_earnings_cents IS 'Total lifetime earnings from completed stringing jobs in cents';

-- Create function to increment stringer earnings
CREATE OR REPLACE FUNCTION public.increment_stringer_earnings(
  p_stringer_id UUID,
  p_amount_cents BIGINT
)
RETURNS void AS $$
BEGIN
  UPDATE public.stringer_settings
  SET total_earnings_cents = total_earnings_cents + p_amount_cents
  WHERE id = p_stringer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.increment_stringer_earnings TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.increment_stringer_earnings IS 'Safely increment a stringer''s total earnings';
