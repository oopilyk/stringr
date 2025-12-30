-- Add flexible_availability field to stringer_settings
ALTER TABLE public.stringer_settings
ADD COLUMN IF NOT EXISTS flexible_availability BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.stringer_settings.flexible_availability IS 'When true, stringer accepts dropoffs at any time - availability slots dont matter';

-- Add preferred_time_slot to requests table
ALTER TABLE public.requests
ADD COLUMN IF NOT EXISTS preferred_time_slot JSONB;

COMMENT ON COLUMN public.requests.preferred_time_slot IS 'Preferred dropoff time slot: {day: "Monday", start: "09:00", end: "12:00"}. Null if stringer has flexible_availability or no preference.';
