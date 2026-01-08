-- Function to authorize payment and update request
-- This bypasses RLS and allows the payment authorization flow to work
CREATE OR REPLACE FUNCTION authorize_request_payment(
  p_request_id UUID,
  p_player_id UUID,
  p_payment_intent_id TEXT,
  p_platform_fee_cents INTEGER,
  p_stringer_earnings_cents INTEGER
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Run with elevated privileges
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

  -- Update the request with payment info and transition to in_progress
  UPDATE requests
  SET
    payment_intent_id = p_payment_intent_id,
    payment_authorized_at = NOW(),
    platform_fee_cents = p_platform_fee_cents,
    stringer_earnings_cents = p_stringer_earnings_cents,
    status = 'in_progress',
    work_started_at = NOW(),
    updated_at = NOW()
  WHERE id = p_request_id;

  -- Return the updated request
  SELECT json_build_object(
    'success', true,
    'request_id', p_request_id,
    'status', 'in_progress',
    'payment_intent_id', p_payment_intent_id
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION authorize_request_payment TO authenticated;

-- Add comment
COMMENT ON FUNCTION authorize_request_payment IS 'Authorizes payment for a request and transitions it to in_progress status. Bypasses RLS to allow payment fields to be updated.';
