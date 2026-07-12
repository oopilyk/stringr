-- Add queue priority for stringer to manually order their queue
-- Lower priority number = higher in queue (first to be worked on)
-- Rush orders automatically get priority boost

ALTER TABLE requests ADD COLUMN IF NOT EXISTS queue_priority INTEGER;

-- Function to get queue position based on stringer's ordering
-- Rush orders always come first, then by queue_priority (if set), then by payment_authorized_at
CREATE OR REPLACE FUNCTION get_queue_position(
  p_request_id UUID,
  p_stringer_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_position INTEGER;
  v_request RECORD;
BEGIN
  -- Get this request's details
  SELECT is_rush, queue_priority, payment_authorized_at, work_started_at
  INTO v_request
  FROM requests
  WHERE id = p_request_id AND stringer_id = p_stringer_id;

  -- If payment not authorized or work already started, not in queue
  IF v_request.payment_authorized_at IS NULL OR v_request.work_started_at IS NOT NULL THEN
    RETURN NULL;
  END IF;

  -- Count how many requests are ahead of this one in the queue
  -- Order: Rush first, then by queue_priority (nulls last), then by payment_authorized_at
  SELECT COUNT(*) + 1 INTO v_position
  FROM requests
  WHERE stringer_id = p_stringer_id
    AND status = 'accepted'
    AND payment_authorized_at IS NOT NULL
    AND work_started_at IS NULL
    AND id != p_request_id
    AND (
      -- Rush orders come before non-rush
      (is_rush = true AND v_request.is_rush = false)
      OR
      -- Within same rush status, compare by priority then time
      (
        COALESCE(is_rush, false) = COALESCE(v_request.is_rush, false)
        AND (
          -- Lower queue_priority comes first (nulls go to end)
          (queue_priority IS NOT NULL AND v_request.queue_priority IS NULL)
          OR
          (queue_priority IS NOT NULL AND v_request.queue_priority IS NOT NULL AND queue_priority < v_request.queue_priority)
          OR
          -- Same priority (or both null), earlier payment time comes first
          (
            COALESCE(queue_priority, 999999) = COALESCE(v_request.queue_priority, 999999)
            AND payment_authorized_at < v_request.payment_authorized_at
          )
        )
      )
    );

  RETURN v_position;
END;
$$;

GRANT EXECUTE ON FUNCTION get_queue_position(UUID, UUID) TO authenticated;
COMMENT ON FUNCTION get_queue_position IS 'Returns queue position. Rush orders first, then by stringer priority, then by payment time.';

-- Function to update queue priorities for a stringer's requests
CREATE OR REPLACE FUNCTION update_queue_priorities(
  p_stringer_id UUID,
  p_request_ids UUID[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id UUID;
  v_priority INTEGER := 1;
BEGIN
  -- Verify the stringer owns all these requests
  IF EXISTS (
    SELECT 1 FROM unnest(p_request_ids) AS rid
    WHERE NOT EXISTS (
      SELECT 1 FROM requests
      WHERE id = rid
        AND stringer_id = p_stringer_id
        AND status = 'accepted'
        AND payment_authorized_at IS NOT NULL
        AND work_started_at IS NULL
    )
  ) THEN
    RAISE EXCEPTION 'Invalid request IDs or requests not in queue';
  END IF;

  -- Update priorities based on array order
  FOREACH v_request_id IN ARRAY p_request_ids
  LOOP
    UPDATE requests
    SET queue_priority = v_priority, updated_at = NOW()
    WHERE id = v_request_id;
    v_priority := v_priority + 1;
  END LOOP;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION update_queue_priorities TO authenticated;
COMMENT ON FUNCTION update_queue_priorities IS 'Updates queue priority order for stringer requests.';
