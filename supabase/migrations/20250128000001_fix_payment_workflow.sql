-- Fix payment authorization workflow
-- Payment authorization should NOT auto-start the job
-- Stringer should explicitly start work on a racket

-- Update the authorize_request_payment function to NOT change status or start work
CREATE OR REPLACE FUNCTION authorize_request_payment(
  p_request_id UUID,
  p_player_id UUID,
  p_payment_intent_id TEXT,
  p_platform_fee_cents INTEGER,
  p_stringer_earnings_cents INTEGER
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
  v_result json;
BEGIN
  -- Verify the request exists, belongs to the player, and is in accepted status
  SELECT * INTO v_request
  FROM requests
  WHERE id = p_request_id
    AND player_id = p_player_id
    AND status = 'accepted'
    AND payment_intent_id IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found, not in accepted status, or payment already authorized';
  END IF;

  -- Update the request with payment info ONLY - do NOT change status or start work
  -- Status stays 'accepted' until stringer explicitly starts work
  UPDATE requests
  SET
    payment_intent_id = p_payment_intent_id,
    payment_authorized_at = NOW(),
    platform_fee_cents = p_platform_fee_cents,
    stringer_earnings_cents = p_stringer_earnings_cents,
    updated_at = NOW()
    -- NOTE: status stays 'accepted', work_started_at stays NULL
  WHERE id = p_request_id;

  -- Return the updated request
  SELECT json_build_object(
    'success', true,
    'request_id', p_request_id,
    'status', 'accepted',
    'payment_authorized', true,
    'payment_intent_id', p_payment_intent_id
  ) INTO v_result;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION authorize_request_payment IS 'Authorizes payment for a request. Status stays accepted until stringer starts work.';

-- New function for stringer to start work on a racket
CREATE OR REPLACE FUNCTION start_racket_work(
  p_request_id UUID,
  p_stringer_id UUID
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
  v_result json;
BEGIN
  -- Verify the request exists, belongs to the stringer, payment is authorized, and not yet started
  SELECT * INTO v_request
  FROM requests
  WHERE id = p_request_id
    AND stringer_id = p_stringer_id
    AND status = 'accepted'
    AND payment_authorized_at IS NOT NULL
    AND work_started_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found, payment not authorized, or work already started';
  END IF;

  -- Now start the work
  UPDATE requests
  SET
    status = 'in_progress',
    work_started_at = NOW(),
    updated_at = NOW()
  WHERE id = p_request_id;

  -- Return success
  SELECT json_build_object(
    'success', true,
    'request_id', p_request_id,
    'status', 'in_progress',
    'work_started_at', NOW()
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION start_racket_work TO authenticated;
COMMENT ON FUNCTION start_racket_work IS 'Stringer starts work on a racket. Creates stringing tasks and changes status to in_progress.';
