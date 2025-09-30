-- Create a function to debug auth.uid() comparison
CREATE OR REPLACE FUNCTION debug_auth_uid_match()
RETURNS TABLE (
  current_user_id uuid,
  auth_uid_result uuid,
  setting_id uuid,
  ids_match boolean
) 
LANGUAGE sql 
SECURITY DEFINER
AS $$
  SELECT 
    auth.uid() as current_user_id,
    auth.uid() as auth_uid_result,
    s.id as setting_id,
    (auth.uid() = s.id) as ids_match
  FROM stringer_settings s 
  WHERE s.id = auth.uid()
  LIMIT 1;
$$;

