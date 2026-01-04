-- Add rush_turnaround_hours column to stringer_settings table
-- This defines the time threshold (in hours) for when a rush fee applies

ALTER TABLE stringer_settings
ADD COLUMN IF NOT EXISTS rush_turnaround_hours INTEGER;

-- Add comment explaining the column
COMMENT ON COLUMN stringer_settings.rush_turnaround_hours IS 'Time threshold in hours - rush fee applies when completion is requested within this timeframe';
