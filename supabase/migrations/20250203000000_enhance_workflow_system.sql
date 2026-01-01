-- Add multi-racket support and edge case handling to requests
ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS racket_count int DEFAULT 1 CHECK (racket_count > 0 AND racket_count <= 10),
  ADD COLUMN IF NOT EXISTS confirmed_string_brand text,
  ADD COLUMN IF NOT EXISTS confirmed_string_model text,
  ADD COLUMN IF NOT EXISTS confirmed_tension_mains_lbs int,
  ADD COLUMN IF NOT EXISTS confirmed_tension_crosses_lbs int,
  ADD COLUMN IF NOT EXISTS string_issue_notes text,
  ADD COLUMN IF NOT EXISTS is_paused boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pause_reason text,
  ADD COLUMN IF NOT EXISTS paused_at timestamptz,
  ADD COLUMN IF NOT EXISTS resumed_at timestamptz,
  ADD COLUMN IF NOT EXISTS actual_completion timestamptz,
  ADD COLUMN IF NOT EXISTS delay_reason text;

-- Add task ordering and pause support to stringing_tasks
ALTER TABLE public.stringing_tasks
  ADD COLUMN IF NOT EXISTS task_order int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_required boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS paused_at timestamptz,
  ADD COLUMN IF NOT EXISTS pause_notes text,
  ADD COLUMN IF NOT EXISTS redo_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS redo_reason text;

-- Update task ordering for existing tasks
UPDATE public.stringing_tasks SET task_order = 1, is_required = true WHERE task_type = 'receive_racket';
UPDATE public.stringing_tasks SET task_order = 2, is_required = true WHERE task_type = 'remove_strings';
UPDATE public.stringing_tasks SET task_order = 3, is_required = false WHERE task_type = 'inspect_frame';
UPDATE public.stringing_tasks SET task_order = 4, is_required = true WHERE task_type = 'mount_racket';
UPDATE public.stringing_tasks SET task_order = 5, is_required = true WHERE task_type = 'string_mains';
UPDATE public.stringing_tasks SET task_order = 6, is_required = true WHERE task_type = 'string_crosses';
UPDATE public.stringing_tasks SET task_order = 7, is_required = true WHERE task_type = 'tie_off';
UPDATE public.stringing_tasks SET task_order = 8, is_required = true WHERE task_type = 'final_inspection';
UPDATE public.stringing_tasks SET task_order = 9, is_required = false WHERE task_type = 'completion_photo';

-- Update the initialize_stringing_tasks function to include new fields
CREATE OR REPLACE FUNCTION initialize_stringing_tasks(p_request_id uuid)
RETURNS void AS $$
DECLARE
  task_configs jsonb := '[
    {"type": "receive_racket", "order": 1, "required": true},
    {"type": "remove_strings", "order": 2, "required": true},
    {"type": "inspect_frame", "order": 3, "required": false},
    {"type": "mount_racket", "order": 4, "required": true},
    {"type": "string_mains", "order": 5, "required": true},
    {"type": "string_crosses", "order": 6, "required": true},
    {"type": "tie_off", "order": 7, "required": true},
    {"type": "final_inspection", "order": 8, "required": true},
    {"type": "completion_photo", "order": 9, "required": false}
  ]'::jsonb;
  task_config jsonb;
BEGIN
  FOR task_config IN SELECT * FROM jsonb_array_elements(task_configs)
  LOOP
    INSERT INTO stringing_tasks (request_id, task_type, status, task_order, is_required)
    VALUES (
      p_request_id,
      task_config->>'type',
      'pending',
      (task_config->>'order')::int,
      (task_config->>'required')::boolean
    )
    ON CONFLICT (request_id, task_type) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create notifications table for milestone tracking
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id uuid NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'job_accepted',
    'stringing_started',
    'mains_complete',
    'crosses_complete',
    'job_finished',
    'ready_for_pickup',
    'job_delayed',
    'job_cancelled',
    'string_issue'
  )),
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  metadata jsonb
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_request_id_idx ON public.notifications(request_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON public.notifications(user_id, is_read);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_request_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_metadata jsonb DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO notifications (user_id, request_id, type, title, message, metadata)
  VALUES (p_user_id, p_request_id, p_type, p_title, p_message, p_metadata)
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate state transitions
CREATE OR REPLACE FUNCTION validate_request_state_transition(
  p_request_id uuid,
  p_new_status text
)
RETURNS boolean AS $$
DECLARE
  current_status text;
  has_started_work boolean;
BEGIN
  SELECT status INTO current_status
  FROM requests
  WHERE id = p_request_id;

  -- Check if any task has been started
  SELECT EXISTS(
    SELECT 1 FROM stringing_tasks
    WHERE request_id = p_request_id
    AND (status = 'in_progress' OR status = 'completed')
  ) INTO has_started_work;

  -- Valid transitions
  IF current_status = 'pending' AND p_new_status IN ('accepted', 'declined') THEN
    RETURN true;
  END IF;

  IF current_status = 'accepted' AND p_new_status IN ('in_progress', 'cancelled') THEN
    RETURN true;
  END IF;

  IF current_status = 'in_progress' AND p_new_status IN ('ready_for_pickup') THEN
    RETURN true;
  END IF;

  -- Cannot cancel after work has started
  IF p_new_status = 'cancelled' AND has_started_work THEN
    RETURN false;
  END IF;

  IF current_status = 'ready_for_pickup' AND p_new_status IN ('completed', 'in_progress') THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get next available task
CREATE OR REPLACE FUNCTION get_next_task(p_request_id uuid)
RETURNS uuid AS $$
DECLARE
  next_task_id uuid;
BEGIN
  -- Get the next pending required task in order
  SELECT id INTO next_task_id
  FROM stringing_tasks
  WHERE request_id = p_request_id
    AND status = 'pending'
    AND is_required = true
  ORDER BY task_order ASC
  LIMIT 1;

  RETURN next_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if task can be started
CREATE OR REPLACE FUNCTION can_start_task(p_task_id uuid)
RETURNS boolean AS $$
DECLARE
  task_record record;
  previous_tasks_complete boolean;
BEGIN
  SELECT * INTO task_record
  FROM stringing_tasks
  WHERE id = p_task_id;

  -- Check if all required tasks before this one are completed
  SELECT NOT EXISTS(
    SELECT 1 FROM stringing_tasks
    WHERE request_id = task_record.request_id
      AND task_order < task_record.task_order
      AND is_required = true
      AND status != 'completed'
  ) INTO previous_tasks_complete;

  RETURN previous_tasks_complete;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create notifications on task completion
CREATE OR REPLACE FUNCTION notify_on_task_completion()
RETURNS TRIGGER AS $$
DECLARE
  req record;
  notification_title text;
  notification_message text;
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    SELECT r.*, p.full_name as player_name, s.full_name as stringer_name
    INTO req
    FROM requests r
    JOIN profiles p ON p.id = r.player_id
    JOIN profiles s ON s.id = r.stringer_id
    WHERE r.id = NEW.request_id;

    -- Notify on milestone tasks
    IF NEW.task_type = 'string_mains' THEN
      notification_title := 'Mains Complete';
      notification_message := req.stringer_name || ' has completed stringing the mains on your racket.';
      PERFORM create_notification(req.player_id, NEW.request_id, 'mains_complete', notification_title, notification_message);
    END IF;

    IF NEW.task_type = 'string_crosses' THEN
      notification_title := 'Crosses Complete';
      notification_message := req.stringer_name || ' has completed stringing the crosses on your racket.';
      PERFORM create_notification(req.player_id, NEW.request_id, 'crosses_complete', notification_title, notification_message);
    END IF;

    IF NEW.task_type = 'final_inspection' THEN
      notification_title := 'Inspection Complete';
      notification_message := 'Your racket has passed final inspection and is being prepared for pickup.';
      PERFORM create_notification(req.player_id, NEW.request_id, 'job_finished', notification_title, notification_message);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS task_completion_notification ON stringing_tasks;
CREATE TRIGGER task_completion_notification
  AFTER UPDATE ON stringing_tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_task_completion();

-- Trigger to create notifications on request state changes
CREATE OR REPLACE FUNCTION notify_on_request_state_change()
RETURNS TRIGGER AS $$
DECLARE
  player_name text;
  stringer_name text;
  notification_title text;
  notification_message text;
BEGIN
  SELECT p.full_name, s.full_name
  INTO player_name, stringer_name
  FROM profiles p
  CROSS JOIN profiles s
  WHERE p.id = NEW.player_id AND s.id = NEW.stringer_id;

  -- Job accepted
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    notification_title := 'Job Accepted!';
    notification_message := stringer_name || ' has accepted your stringing request.';
    PERFORM create_notification(NEW.player_id, NEW.id, 'job_accepted', notification_title, notification_message);
  END IF;

  -- Stringing started
  IF NEW.status = 'in_progress' AND OLD.status = 'accepted' THEN
    notification_title := 'Stringing Started';
    notification_message := stringer_name || ' has started working on your racket.';
    PERFORM create_notification(NEW.player_id, NEW.id, 'stringing_started', notification_title, notification_message);
  END IF;

  -- Ready for pickup
  IF NEW.status = 'ready_for_pickup' AND OLD.status = 'in_progress' THEN
    notification_title := 'Ready for Pickup!';
    notification_message := 'Your racket is ready for pickup. ' || stringer_name || ' has completed the job.';
    PERFORM create_notification(NEW.player_id, NEW.id, 'ready_for_pickup', notification_title, notification_message);
  END IF;

  -- Job cancelled
  IF NEW.status = 'cancelled' THEN
    notification_title := 'Job Cancelled';
    notification_message := 'This stringing request has been cancelled.';
    PERFORM create_notification(NEW.player_id, NEW.id, 'job_cancelled', notification_title, notification_message);
    PERFORM create_notification(NEW.stringer_id, NEW.id, 'job_cancelled', notification_title, notification_message);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS request_state_change_notification ON requests;
CREATE TRIGGER request_state_change_notification
  AFTER UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_request_state_change();
