-- User Reports System
-- Allows players and stringers to report each other for violations

-- Report reasons enum
CREATE TYPE public.report_reason AS ENUM (
  'inappropriate_behavior',
  'no_show',
  'scam_fraud',
  'harassment',
  'quality_issues',
  'communication_issues',
  'other'
);

-- Report status enum
CREATE TYPE public.report_status AS ENUM (
  'pending',
  'under_review',
  'resolved',
  'dismissed'
);

-- User reports table
CREATE TABLE public.user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.requests(id) ON DELETE SET NULL,
  reason public.report_reason NOT NULL,
  description TEXT NOT NULL,
  status public.report_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT reporter_not_self CHECK (reporter_id != reported_user_id),
  CONSTRAINT description_min_length CHECK (length(description) >= 20)
);

-- Index for faster lookups
CREATE INDEX user_reports_reporter_idx ON public.user_reports(reporter_id);
CREATE INDEX user_reports_reported_idx ON public.user_reports(reported_user_id);
CREATE INDEX user_reports_status_idx ON public.user_reports(status);
CREATE INDEX user_reports_request_idx ON public.user_reports(request_id);

-- RLS policies
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports
CREATE POLICY "Users can create reports"
  ON public.user_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports (as reporter)
CREATE POLICY "Users can view their own reports"
  ON public.user_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- Comments for documentation
COMMENT ON TABLE public.user_reports IS 'User reports for violations and issues';
COMMENT ON COLUMN public.user_reports.reason IS 'Category of the report';
COMMENT ON COLUMN public.user_reports.description IS 'Detailed description of the issue (min 20 chars)';
COMMENT ON COLUMN public.user_reports.request_id IS 'Optional: related stringing request';
