-- Add tip and completion photo fields to requests table
ALTER TABLE public.requests
ADD COLUMN tip_cents INTEGER DEFAULT 0,
ADD COLUMN completion_photo_url TEXT;

-- Add comments
COMMENT ON COLUMN public.requests.tip_cents IS 'Tip amount given to stringer in cents';
COMMENT ON COLUMN public.requests.completion_photo_url IS 'Photo of the strung racket after completion';
