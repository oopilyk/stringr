-- Add pickup window fields to requests table
-- Players have 48 hours to pick up completed rackets, with option to request extensions

-- Add pickup deadline when request is marked as ready
ALTER TABLE public.requests
ADD COLUMN IF NOT EXISTS pickup_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS extension_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS extension_request_reason TEXT,
ADD COLUMN IF NOT EXISTS extension_approved BOOLEAN,
ADD COLUMN IF NOT EXISTS extension_response_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS extension_response_reason TEXT;

-- Add comment explaining the pickup window system
COMMENT ON COLUMN public.requests.pickup_deadline IS
  'Deadline for player to pick up completed racket (set to ready_at + 48 hours when status changes to ready)';
COMMENT ON COLUMN public.requests.extension_requested_at IS
  'Timestamp when player requested a pickup extension';
COMMENT ON COLUMN public.requests.extension_request_reason IS
  'Reason provided by player for needing an extension';
COMMENT ON COLUMN public.requests.extension_approved IS
  'Whether the stringer approved the extension request (null = pending)';
COMMENT ON COLUMN public.requests.extension_response_at IS
  'Timestamp when stringer responded to extension request';
COMMENT ON COLUMN public.requests.extension_response_reason IS
  'Reason provided by stringer for approving/denying extension';

-- Function to set pickup deadline when request becomes ready
CREATE OR REPLACE FUNCTION public.set_pickup_deadline()
RETURNS TRIGGER AS $$
BEGIN
  -- Set 48-hour pickup deadline when status changes to 'ready'
  IF NEW.status = 'ready' AND (OLD.status IS NULL OR OLD.status != 'ready') THEN
    NEW.pickup_deadline = NOW() + INTERVAL '48 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-set pickup deadline
DROP TRIGGER IF EXISTS set_pickup_deadline_trigger ON public.requests;
CREATE TRIGGER set_pickup_deadline_trigger
  BEFORE UPDATE ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_pickup_deadline();

-- Function to extend pickup deadline (adds 24 hours when extension is approved)
CREATE OR REPLACE FUNCTION public.approve_pickup_extension(
  p_request_id UUID,
  p_stringer_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_request RECORD;
BEGIN
  -- Get request and verify stringer owns it
  SELECT * INTO v_request FROM public.requests WHERE id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF v_request.stringer_id != p_stringer_id THEN
    RAISE EXCEPTION 'Not authorized to approve extension';
  END IF;

  IF v_request.extension_requested_at IS NULL THEN
    RAISE EXCEPTION 'No extension request pending';
  END IF;

  IF v_request.extension_approved IS NOT NULL THEN
    RAISE EXCEPTION 'Extension already responded to';
  END IF;

  -- Approve extension and add 24 hours to deadline
  UPDATE public.requests
  SET
    extension_approved = TRUE,
    extension_response_at = NOW(),
    extension_response_reason = p_reason,
    pickup_deadline = COALESCE(pickup_deadline, NOW()) + INTERVAL '24 hours',
    updated_at = NOW()
  WHERE id = p_request_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deny pickup extension
CREATE OR REPLACE FUNCTION public.deny_pickup_extension(
  p_request_id UUID,
  p_stringer_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_request RECORD;
BEGIN
  -- Get request and verify stringer owns it
  SELECT * INTO v_request FROM public.requests WHERE id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF v_request.stringer_id != p_stringer_id THEN
    RAISE EXCEPTION 'Not authorized to deny extension';
  END IF;

  IF v_request.extension_requested_at IS NULL THEN
    RAISE EXCEPTION 'No extension request pending';
  END IF;

  IF v_request.extension_approved IS NOT NULL THEN
    RAISE EXCEPTION 'Extension already responded to';
  END IF;

  -- Deny extension
  UPDATE public.requests
  SET
    extension_approved = FALSE,
    extension_response_at = NOW(),
    extension_response_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_request_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.approve_pickup_extension TO authenticated;
GRANT EXECUTE ON FUNCTION public.deny_pickup_extension TO authenticated;
