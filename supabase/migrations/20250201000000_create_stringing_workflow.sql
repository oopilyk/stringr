-- Drop old status check constraint and add new one with updated statuses
ALTER TABLE public.requests DROP CONSTRAINT IF EXISTS requests_status_check;

-- Add workflow fields to requests table
ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS work_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS ready_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS estimated_completion timestamptz,
  ADD COLUMN IF NOT EXISTS actual_string_installed text,
  ADD COLUMN IF NOT EXISTS completion_notes text,
  ADD COLUMN IF NOT EXISTS completion_photo_url text,
  ADD COLUMN IF NOT EXISTS is_rush boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS rework_count int DEFAULT 0;

-- Add new status check constraint with all workflow statuses
ALTER TABLE public.requests
  ADD CONSTRAINT requests_status_check CHECK (status IN (
    'pending',
    'accepted',
    'scheduled',
    'in_progress',
    'ready_for_pickup',
    'completed',
    'cancelled',
    'declined' -- Keep for backwards compatibility
  ));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS requests_status_idx ON public.requests(status);
CREATE INDEX IF NOT EXISTS requests_stringer_status_idx ON public.requests(stringer_id, status);
CREATE INDEX IF NOT EXISTS requests_player_status_idx ON public.requests(player_id, status);

-- Create stringing_tasks table
CREATE TABLE IF NOT EXISTS public.stringing_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  task_type text NOT NULL CHECK (task_type IN (
    'receive_racket',
    'remove_strings',
    'inspect_frame',
    'mount_racket',
    'string_mains',
    'string_crosses',
    'tie_off',
    'final_inspection',
    'completion_photo'
  )),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  photo_url text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_task_timestamps CHECK (started_at IS NULL OR completed_at IS NULL OR started_at <= completed_at),
  CONSTRAINT unique_task_per_request UNIQUE (request_id, task_type)
);

CREATE INDEX IF NOT EXISTS stringing_tasks_request_id_idx ON public.stringing_tasks(request_id);
CREATE INDEX IF NOT EXISTS stringing_tasks_status_idx ON public.stringing_tasks(status);

-- Create request_state_changes audit log
CREATE TABLE IF NOT EXISTS public.request_state_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  from_status text NOT NULL,
  to_status text NOT NULL,
  changed_by uuid NOT NULL REFERENCES profiles(id),
  changed_at timestamptz DEFAULT now(),
  reason text,
  metadata jsonb
);

CREATE INDEX IF NOT EXISTS request_state_changes_request_id_idx ON public.request_state_changes(request_id);
CREATE INDEX IF NOT EXISTS request_state_changes_changed_at_idx ON public.request_state_changes(changed_at DESC);

-- Enable RLS on new tables
ALTER TABLE public.stringing_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_state_changes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stringing_tasks
CREATE POLICY "Stringers can manage tasks for their requests"
  ON public.stringing_tasks FOR ALL
  USING (
    request_id IN (
      SELECT id FROM requests WHERE stringer_id = auth.uid()
    )
  );

CREATE POLICY "Players can view tasks for their requests"
  ON public.stringing_tasks FOR SELECT
  USING (
    request_id IN (
      SELECT id FROM requests WHERE player_id = auth.uid()
    )
  );

-- RLS Policies for request_state_changes
CREATE POLICY "Users can view state changes for their requests"
  ON public.request_state_changes FOR SELECT
  USING (
    request_id IN (
      SELECT id FROM requests
      WHERE player_id = auth.uid() OR stringer_id = auth.uid()
    )
  );

CREATE POLICY "Users can create state changes for their requests"
  ON public.request_state_changes FOR INSERT
  WITH CHECK (
    request_id IN (
      SELECT id FROM requests
      WHERE player_id = auth.uid() OR stringer_id = auth.uid()
    )
  );

-- Function to initialize stringing tasks when request is accepted
CREATE OR REPLACE FUNCTION initialize_stringing_tasks(p_request_id uuid)
RETURNS void AS $$
DECLARE
  task_types text[] := ARRAY[
    'receive_racket',
    'remove_strings',
    'inspect_frame',
    'mount_racket',
    'string_mains',
    'string_crosses',
    'tie_off',
    'final_inspection',
    'completion_photo'
  ];
  task_type text;
BEGIN
  FOREACH task_type IN ARRAY task_types
  LOOP
    INSERT INTO stringing_tasks (request_id, task_type, status)
    VALUES (p_request_id, task_type, 'pending')
    ON CONFLICT (request_id, task_type) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate request progress
CREATE OR REPLACE FUNCTION calculate_request_progress(p_request_id uuid)
RETURNS int AS $$
DECLARE
  required_tasks text[] := ARRAY[
    'receive_racket',
    'remove_strings',
    'mount_racket',
    'string_mains',
    'string_crosses',
    'tie_off',
    'final_inspection'
  ];
  completed_count int;
  total_count int;
BEGIN
  SELECT COUNT(*) INTO total_count FROM unnest(required_tasks);

  SELECT COUNT(*) INTO completed_count
  FROM stringing_tasks
  WHERE request_id = p_request_id
    AND task_type = ANY(required_tasks)
    AND status = 'completed';

  RETURN FLOOR((completed_count::float / total_count::float) * 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if all required tasks are completed
CREATE OR REPLACE FUNCTION all_required_tasks_completed(p_request_id uuid)
RETURNS boolean AS $$
DECLARE
  required_tasks text[] := ARRAY[
    'receive_racket',
    'remove_strings',
    'mount_racket',
    'string_mains',
    'string_crosses',
    'tie_off',
    'final_inspection'
  ];
  incomplete_count int;
BEGIN
  SELECT COUNT(*) INTO incomplete_count
  FROM unnest(required_tasks) AS task_type
  WHERE NOT EXISTS (
    SELECT 1 FROM stringing_tasks
    WHERE request_id = p_request_id
      AND stringing_tasks.task_type = unnest.task_type
      AND status = 'completed'
  );

  RETURN incomplete_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
