-- Add viewed_at column to requests table
ALTER TABLE public.requests
ADD COLUMN viewed_at timestamptz;

-- Add comment
COMMENT ON COLUMN public.requests.viewed_at IS 'Timestamp when the stringer first viewed this request';
