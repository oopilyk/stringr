-- Drop existing requests table if it exists
DROP TABLE IF EXISTS public.requests CASCADE;

-- Create requests table for stringing service requests
CREATE TABLE public.requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Relationships
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stringer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Request status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Waiting for stringer response
    'accepted',     -- Stringer accepted
    'declined',     -- Stringer declined
    'in_progress',  -- Work started
    'completed',    -- Work finished
    'cancelled'     -- Cancelled by player or stringer
  )),

  -- Racket photo (REQUIRED)
  racket_photo_url TEXT NOT NULL,

  -- Service details
  service_type TEXT NOT NULL CHECK (service_type IN (
    'restring_only',
    'restring_grip',
    'restring_grommets',
    'full_service'
  )),

  -- String selection (snapshot from stringer's inventory at time of request)
  string_selection JSONB NOT NULL,
  -- Example: {"brand": "Babolat", "model": "RPM Blast", "gauge": "16g", "price_cents": 1800}

  -- Tension specification
  tension_mains_lbs INTEGER NOT NULL CHECK (tension_mains_lbs >= 10 AND tension_mains_lbs <= 90),
  tension_crosses_lbs INTEGER NOT NULL CHECK (tension_crosses_lbs >= 10 AND tension_crosses_lbs <= 90),

  -- String pattern preference
  string_pattern TEXT NOT NULL CHECK (string_pattern IN (
    'existing',
    'two_piece',
    'one_piece',
    'ask_stringer'
  )),

  -- Dropoff method (snapshot from stringer's options at time of request)
  dropoff_method JSONB NOT NULL,
  -- Example: {"method": "drop_off", "details": "123 Main St, Baltimore MD"}

  -- Optional fields
  special_instructions TEXT,
  preferred_completion_date DATE,

  -- Pricing (calculated at request time, may be updated by stringer)
  estimated_price_cents INTEGER NOT NULL,
  final_price_cents INTEGER, -- Set when request is accepted/completed

  -- Timestamps for state changes
  accepted_at TIMESTAMP WITH TIME ZONE,
  declined_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,

  -- Cancellation/decline reason
  cancellation_reason TEXT,
  decline_reason TEXT
);

-- Create indexes for efficient queries
CREATE INDEX idx_requests_player_id ON public.requests(player_id);
CREATE INDEX idx_requests_stringer_id ON public.requests(stringer_id);
CREATE INDEX idx_requests_status ON public.requests(status);
CREATE INDEX idx_requests_created_at ON public.requests(created_at DESC);

-- Composite index for stringer's pending requests (most common query)
CREATE INDEX idx_requests_stringer_pending ON public.requests(stringer_id, status)
  WHERE status = 'pending';

-- Enable Row Level Security
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Players can view their own requests
CREATE POLICY "Players can view own requests"
  ON public.requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = player_id);

-- Stringers can view requests sent to them
CREATE POLICY "Stringers can view requests sent to them"
  ON public.requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = stringer_id);

-- Players can create requests
CREATE POLICY "Players can create requests"
  ON public.requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = player_id AND
    status = 'pending' -- Can only create pending requests
  );

-- Players can update their own pending requests (cancel only)
CREATE POLICY "Players can cancel own requests"
  ON public.requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = player_id)
  WITH CHECK (
    auth.uid() = player_id AND
    status IN ('cancelled') AND
    cancelled_at IS NOT NULL
  );

-- Stringers can update requests sent to them (accept, decline, update status)
CREATE POLICY "Stringers can update their requests"
  ON public.requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = stringer_id)
  WITH CHECK (auth.uid() = stringer_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER requests_updated_at_trigger
  BEFORE UPDATE ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION update_requests_updated_at();

-- Add accepting_requests field to stringer_settings
ALTER TABLE public.stringer_settings
ADD COLUMN IF NOT EXISTS accepting_requests BOOLEAN DEFAULT true;

-- Create storage bucket for racket photos (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('racket_photos', 'racket_photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for racket photos
CREATE POLICY "Users can upload to own folder"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'racket_photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Public read access for racket photos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'racket_photos');

CREATE POLICY "Users can update own racket photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'racket_photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
