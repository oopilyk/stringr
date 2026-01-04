-- Migration: Simplify dropoff methods to only use 'dropoff'
-- Created: 2025-02-03

-- Update all existing stringer_settings dropoff_methods to use 'dropoff'
UPDATE public.stringer_settings
SET dropoff_methods = jsonb_build_array(
  jsonb_build_object(
    'method', 'dropoff',
    'enabled', true,
    'details', COALESCE(
      (
        SELECT dm->>'details'
        FROM jsonb_array_elements(dropoff_methods) AS dm
        WHERE dm->>'enabled' = 'true'
        LIMIT 1
      ),
      'Drop off at my location'
    )
  )
)
WHERE dropoff_methods IS NOT NULL
  AND jsonb_array_length(dropoff_methods) > 0;

-- Update all existing requests dropoff_method to use 'dropoff'
UPDATE public.requests
SET dropoff_method = jsonb_build_object(
  'method', 'dropoff',
  'enabled', true,
  'details', COALESCE(
    dropoff_method->>'details',
    'Drop off at stringer location'
  )
)
WHERE dropoff_method IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.stringer_settings.dropoff_methods IS 'Simplified to only support dropoff method';
COMMENT ON COLUMN public.requests.dropoff_method IS 'Simplified to only support dropoff method';
