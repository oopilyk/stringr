-- Add missing DELETE policy for stringer_settings
-- This allows stringers to delete their own settings (stop providing services)

create policy "Stringers can delete their own settings" on public.stringer_settings
  for delete using (auth.uid() = id);

