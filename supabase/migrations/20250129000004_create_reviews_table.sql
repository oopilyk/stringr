-- Drop old reviews table and related objects
DROP VIEW IF EXISTS public.stringer_ratings CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;

-- Create reviews table for both player and stringer reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- The request this review is associated with
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,

  -- Who is being reviewed
  reviewee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Who wrote the review
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Review type: 'stringer_review' (player reviewing stringer) or 'player_review' (stringer reviewing player)
  review_type TEXT NOT NULL CHECK (review_type IN ('stringer_review', 'player_review')),

  -- Rating (1-5 stars)
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),

  -- Review text
  comment TEXT,

  -- Prevent duplicate reviews for the same request
  UNIQUE(request_id, reviewer_id, review_type)
);

-- Add indexes for efficient queries
CREATE INDEX idx_reviews_reviewee ON public.reviews(reviewee_id);
CREATE INDEX idx_reviews_reviewer ON public.reviews(reviewer_id);
CREATE INDEX idx_reviews_request ON public.reviews(request_id);
CREATE INDEX idx_reviews_type ON public.reviews(review_type);
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at DESC);

-- Add comments
COMMENT ON TABLE public.reviews IS 'Reviews for both stringers and players';
COMMENT ON COLUMN public.reviews.review_type IS 'Type of review: stringer_review (player reviewing stringer) or player_review (stringer reviewing player)';
COMMENT ON COLUMN public.reviews.rating IS 'Star rating from 1-5';

-- Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Anyone can view reviews
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews
  FOR SELECT
  USING (true);

-- Users can create reviews for requests they were part of
CREATE POLICY "Users can create reviews for their requests"
  ON public.reviews
  FOR INSERT
  WITH CHECK (
    -- Must be the reviewer
    auth.uid() = reviewer_id
    AND
    -- Must be part of the request (either as player or stringer)
    EXISTS (
      SELECT 1 FROM public.requests
      WHERE requests.id = request_id
      AND (requests.player_id = auth.uid() OR requests.stringer_id = auth.uid())
    )
    AND
    -- Ensure correct review type
    (
      (review_type = 'stringer_review' AND EXISTS (
        SELECT 1 FROM public.requests
        WHERE requests.id = request_id AND requests.player_id = auth.uid()
      ))
      OR
      (review_type = 'player_review' AND EXISTS (
        SELECT 1 FROM public.requests
        WHERE requests.id = request_id AND requests.stringer_id = auth.uid()
      ))
    )
  );

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
  ON public.reviews
  FOR UPDATE
  USING (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
  ON public.reviews
  FOR DELETE
  USING (auth.uid() = reviewer_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();

-- Create a view for aggregated ratings
CREATE OR REPLACE VIEW public.user_ratings AS
SELECT
  reviewee_id as user_id,
  review_type,
  COUNT(*) as review_count,
  ROUND(AVG(rating)::numeric, 1) as avg_rating
FROM public.reviews
GROUP BY reviewee_id, review_type;

COMMENT ON VIEW public.user_ratings IS 'Aggregated ratings for users by review type';
