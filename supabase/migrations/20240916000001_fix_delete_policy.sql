-- Ensure the DELETE policy for stringer_settings is properly created
-- First drop if exists, then recreate

DROP POLICY IF EXISTS "Stringers can delete their own settings" ON public.stringer_settings;

CREATE POLICY "Stringers can delete their own settings" ON public.stringer_settings
  FOR DELETE USING (auth.uid() = id);

