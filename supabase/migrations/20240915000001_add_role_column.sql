-- Add role column back to profiles table
ALTER TABLE public.profiles ADD COLUMN role text;

-- Create index for role column 
CREATE INDEX profiles_role_idx ON public.profiles(role);

-- Update existing profiles based on whether they have stringer_settings
UPDATE public.profiles 
SET role = CASE 
  WHEN EXISTS (SELECT 1 FROM public.stringer_settings WHERE stringer_settings.id = profiles.id) THEN 'stringer'
  ELSE 'player'
END;
