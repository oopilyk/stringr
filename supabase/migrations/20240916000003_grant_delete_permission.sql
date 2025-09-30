-- Grant DELETE permission to authenticated users on stringer_settings
-- This is required before RLS policies can take effect for DELETE operations

GRANT DELETE ON public.stringer_settings TO authenticated;

-- Also ensure the DELETE policy exists and is correct
DROP POLICY IF EXISTS "Stringers can delete their own settings" ON public.stringer_settings;

CREATE POLICY "Stringers can delete their own settings" ON public.stringer_settings
  FOR DELETE TO authenticated USING (auth.uid() = id);

