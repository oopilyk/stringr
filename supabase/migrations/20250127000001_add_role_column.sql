-- Add role column to profiles table
-- This was removed in the initial schema but the application code still expects it

-- Create user_role enum type
create type public.user_role as enum ('player', 'stringer');

-- Add role column to profiles table
alter table public.profiles
add column role public.user_role default 'player';

-- Add comment
comment on column public.profiles.role is 'User role: player or stringer';

-- Create index for faster role-based queries
create index profiles_role_idx on public.profiles(role);
