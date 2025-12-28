-- Migration: Add stringer onboarding fields and profile completeness tracking
-- Created: 2025-01-01

-- Add new fields to profiles table for stringer background
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS years_experience INTEGER,
ADD COLUMN IF NOT EXISTS rackets_strung_count INTEGER,
ADD COLUMN IF NOT EXISTS certifications TEXT[],
ADD COLUMN IF NOT EXISTS stringing_location TEXT,
ADD COLUMN IF NOT EXISTS player_levels_served TEXT[],
ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0;

-- Add new fields to stringer_settings table
ALTER TABLE public.stringer_settings
ADD COLUMN IF NOT EXISTS machine_brand TEXT,
ADD COLUMN IF NOT EXISTS machine_model TEXT,
ADD COLUMN IF NOT EXISTS machine_type TEXT,
ADD COLUMN IF NOT EXISTS supported_racket_types TEXT[],
ADD COLUMN IF NOT EXISTS max_tension INTEGER,
ADD COLUMN IF NOT EXISTS string_inventory JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS dropoff_methods JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS pricing_notes TEXT,
ADD COLUMN IF NOT EXISTS accepts_player_strings BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS discount_bulk_jobs INTEGER,
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Create index for onboarding completion queries
CREATE INDEX IF NOT EXISTS stringer_settings_onboarding_idx
ON public.stringer_settings(onboarding_step)
WHERE onboarding_step < 7;

-- Function to calculate profile completeness
CREATE OR REPLACE FUNCTION public.calculate_profile_completeness(profile_id UUID)
RETURNS INTEGER AS $$
DECLARE
  completion INTEGER := 0;
  p public.profiles;
  s public.stringer_settings;
BEGIN
  SELECT * INTO p FROM public.profiles WHERE id = profile_id;
  SELECT * INTO s FROM public.stringer_settings WHERE id = profile_id;

  -- If stringer_settings doesn't exist, return 0
  IF s.id IS NULL THEN
    RETURN 0;
  END IF;

  -- Basic info (Step 1) - 15%
  IF p.full_name IS NOT NULL AND p.full_name != '' THEN completion := completion + 3; END IF;
  IF p.phone IS NOT NULL AND p.phone != '' THEN completion := completion + 3; END IF;
  IF p.city IS NOT NULL AND p.city != '' THEN completion := completion + 3; END IF;
  IF p.lat IS NOT NULL AND p.lng IS NOT NULL THEN completion := completion + 3; END IF;
  IF p.bio IS NOT NULL AND p.bio != '' THEN completion := completion + 3; END IF;

  -- Background (Step 2) - 15%
  IF p.years_experience IS NOT NULL THEN completion := completion + 3; END IF;
  IF p.rackets_strung_count IS NOT NULL THEN completion := completion + 3; END IF;
  IF p.certifications IS NOT NULL AND array_length(p.certifications, 1) > 0 THEN completion := completion + 3; END IF;
  IF p.stringing_location IS NOT NULL AND p.stringing_location != '' THEN completion := completion + 3; END IF;
  IF p.player_levels_served IS NOT NULL AND array_length(p.player_levels_served, 1) > 0 THEN completion := completion + 3; END IF;

  -- Equipment (Step 3) - 15%
  IF s.machine_brand IS NOT NULL AND s.machine_brand != '' THEN completion := completion + 3; END IF;
  IF s.machine_model IS NOT NULL AND s.machine_model != '' THEN completion := completion + 3; END IF;
  IF s.machine_type IS NOT NULL AND s.machine_type != '' THEN completion := completion + 3; END IF;
  IF s.supported_racket_types IS NOT NULL AND array_length(s.supported_racket_types, 1) > 0 THEN completion := completion + 3; END IF;
  IF s.max_tension IS NOT NULL THEN completion := completion + 3; END IF;

  -- Pricing (Step 4) - 20%
  IF s.base_price_cents > 0 THEN completion := completion + 5; END IF;
  IF s.turnaround_hours > 0 THEN completion := completion + 5; END IF;
  IF s.accepts_rush IS NOT NULL THEN completion := completion + 5; END IF;
  IF s.rush_fee_cents IS NOT NULL THEN completion := completion + 5; END IF;

  -- String inventory (Step 5) - 15%
  IF s.string_inventory IS NOT NULL AND jsonb_array_length(s.string_inventory) > 0 THEN
    completion := completion + 15;
  END IF;

  -- Availability (Step 6) - 20%
  IF s.dropoff_methods IS NOT NULL AND jsonb_array_length(s.dropoff_methods) > 0 THEN
    completion := completion + 10;
  END IF;
  IF s.availability IS NOT NULL AND jsonb_array_length(s.availability) > 0 THEN
    completion := completion + 10;
  END IF;

  RETURN LEAST(completion, 100);
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update profile completeness on changes
CREATE OR REPLACE FUNCTION public.update_profile_completeness()
RETURNS TRIGGER AS $$
DECLARE
  new_percentage INTEGER;
BEGIN
  new_percentage := calculate_profile_completeness(NEW.id);

  -- Only update if the percentage has changed (prevents infinite recursion)
  IF TG_TABLE_NAME = 'profiles' THEN
    IF NEW.profile_completion_percentage IS DISTINCT FROM new_percentage THEN
      NEW.profile_completion_percentage := new_percentage;
      NEW.profile_complete := new_percentage >= 90;
    END IF;
  ELSIF TG_TABLE_NAME = 'stringer_settings' THEN
    UPDATE public.profiles
    SET
      profile_completion_percentage = new_percentage,
      profile_complete = new_percentage >= 90
    WHERE id = NEW.id
      AND (profile_completion_percentage IS DISTINCT FROM new_percentage);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS profiles_completeness_update ON public.profiles;
DROP TRIGGER IF EXISTS stringer_settings_completeness_update ON public.stringer_settings;

-- Create triggers for automatic completeness calculation
CREATE TRIGGER profiles_completeness_update
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_profile_completeness();

CREATE TRIGGER stringer_settings_completeness_update
AFTER INSERT OR UPDATE ON public.stringer_settings
FOR EACH ROW
EXECUTE FUNCTION update_profile_completeness();

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.years_experience IS 'Years of stringing experience (0-50)';
COMMENT ON COLUMN public.profiles.rackets_strung_count IS 'Approximate number of rackets strung in career';
COMMENT ON COLUMN public.profiles.certifications IS 'Array of certification names (USRSA, ERSA, etc.)';
COMMENT ON COLUMN public.profiles.stringing_location IS 'Where stringing is performed (Home shop, Tennis club, Mobile, etc.)';
COMMENT ON COLUMN public.profiles.player_levels_served IS 'Array of player levels served (Beginner, Intermediate, Advanced, etc.)';
COMMENT ON COLUMN public.profiles.profile_complete IS 'Whether profile is considered complete (>= 90%)';
COMMENT ON COLUMN public.profiles.profile_completion_percentage IS 'Profile completeness score 0-100';

COMMENT ON COLUMN public.stringer_settings.machine_brand IS 'Stringing machine brand (Gamma, Babolat, Wilson, etc.)';
COMMENT ON COLUMN public.stringer_settings.machine_model IS 'Stringing machine model';
COMMENT ON COLUMN public.stringer_settings.machine_type IS 'Machine type: drop-weight, electronic, or crank';
COMMENT ON COLUMN public.stringer_settings.supported_racket_types IS 'Array of racket types (Tennis, Badminton, Squash, etc.)';
COMMENT ON COLUMN public.stringer_settings.max_tension IS 'Maximum tension the machine can handle (lbs)';
COMMENT ON COLUMN public.stringer_settings.string_inventory IS 'JSONB array of string inventory items';
COMMENT ON COLUMN public.stringer_settings.dropoff_methods IS 'JSONB array of dropoff method configurations';
COMMENT ON COLUMN public.stringer_settings.pricing_notes IS 'Additional pricing notes or explanations';
COMMENT ON COLUMN public.stringer_settings.accepts_player_strings IS 'Whether stringer accepts player-provided strings';
COMMENT ON COLUMN public.stringer_settings.discount_bulk_jobs IS 'Percentage discount for multiple rackets (0-50)';
COMMENT ON COLUMN public.stringer_settings.onboarding_step IS 'Current onboarding step (1-7), null if completed';
COMMENT ON COLUMN public.stringer_settings.onboarding_completed_at IS 'Timestamp when onboarding was completed';
