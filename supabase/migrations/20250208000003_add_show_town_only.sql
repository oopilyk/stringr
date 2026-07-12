-- Add show_town_only field to stringer_settings
-- When true, only the town/city name (without state/country) is shown to players
-- This provides privacy for stringers who don't want their full location visible

ALTER TABLE public.stringer_settings
ADD COLUMN IF NOT EXISTS show_town_only BOOLEAN NOT NULL DEFAULT false;

-- Add comment explaining the field
COMMENT ON COLUMN public.stringer_settings.show_town_only IS
  'When true, only display town name (e.g., "Baltimore") instead of full location (e.g., "Baltimore, MD")';
