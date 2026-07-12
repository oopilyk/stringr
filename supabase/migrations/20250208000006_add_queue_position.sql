-- Queue Position System
-- NOTE: The main get_queue_position function is defined in 20250129000005_add_queue_priority.sql
-- This migration only adds the is_rush column and get_stringer_queue helper function

-- Add is_rush column to requests if not exists
ALTER TABLE public.requests
ADD COLUMN IF NOT EXISTS is_rush BOOLEAN NOT NULL DEFAULT false;

-- Drop the old single-parameter version if it exists (superseded by 2-parameter version)
DROP FUNCTION IF EXISTS public.get_queue_position(UUID);

-- Function to get the full queue for a stringer
CREATE OR REPLACE FUNCTION public.get_stringer_queue(
  p_stringer_id UUID
)
RETURNS TABLE (
  request_id UUID,
  player_id UUID,
  status TEXT,
  is_rush BOOLEAN,
  accepted_at TIMESTAMP WITH TIME ZONE,
  work_started_at TIMESTAMP WITH TIME ZONE,
  estimated_completion TIMESTAMP WITH TIME ZONE,
  queue_position INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id as request_id,
    r.player_id,
    r.status,
    r.is_rush,
    r.accepted_at,
    r.work_started_at,
    r.estimated_completion,
    ROW_NUMBER() OVER (
      ORDER BY
        r.is_rush DESC,  -- Rush orders first
        COALESCE(r.queue_priority, 999999) ASC,  -- Then by priority
        r.payment_authorized_at ASC  -- Then by payment time (FIFO)
    )::INTEGER as queue_position
  FROM public.requests r
  WHERE r.stringer_id = p_stringer_id
    AND r.status = 'accepted'
    AND r.payment_authorized_at IS NOT NULL
    AND r.work_started_at IS NULL
  ORDER BY
    r.is_rush DESC,
    COALESCE(r.queue_priority, 999999) ASC,
    r.payment_authorized_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_stringer_queue TO authenticated;

-- Add comments
COMMENT ON FUNCTION public.get_stringer_queue IS
  'Get the ordered queue of requests awaiting start for a stringer. Rush orders first, then by priority, then by payment time.';
