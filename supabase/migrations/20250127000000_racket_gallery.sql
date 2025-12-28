-- Create racket_gallery table for storing stringer portfolio images
create table public.racket_gallery (
  id uuid primary key default gen_random_uuid(),
  stringer_id uuid not null references public.profiles(id) on delete cascade,
  image_url text not null,
  caption text,
  racquet_brand text,
  racquet_model text,
  string_used text,
  tension_lbs numeric(4,1),
  display_order integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add index for faster queries by stringer
create index racket_gallery_stringer_id_idx on public.racket_gallery(stringer_id);

-- Add index for display order
create index racket_gallery_display_order_idx on public.racket_gallery(stringer_id, display_order);

-- Enable RLS
alter table public.racket_gallery enable row level security;

-- RLS Policies

-- Anyone can view gallery images
create policy "Gallery images are viewable by everyone"
  on public.racket_gallery for select
  using (true);

-- Only the stringer can insert their own gallery images
create policy "Stringers can insert their own gallery images"
  on public.racket_gallery for insert
  with check (auth.uid() = stringer_id);

-- Only the stringer can update their own gallery images
create policy "Stringers can update their own gallery images"
  on public.racket_gallery for update
  using (auth.uid() = stringer_id);

-- Only the stringer can delete their own gallery images
create policy "Stringers can delete their own gallery images"
  on public.racket_gallery for delete
  using (auth.uid() = stringer_id);

-- Function to auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for racket_gallery updated_at
create trigger handle_racket_gallery_updated_at
  before update on public.racket_gallery
  for each row
  execute function public.handle_updated_at();

-- Create storage bucket for racket gallery images
insert into storage.buckets (id, name, public)
values ('racket-gallery', 'racket-gallery', true)
on conflict (id) do nothing;

-- Storage policies for racket-gallery bucket

-- Anyone can view racket gallery images
create policy "Racket gallery images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'racket-gallery');

-- Authenticated users can upload to their own folder
create policy "Users can upload racket gallery images to their own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'racket-gallery'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update their own racket gallery images
create policy "Users can update their own racket gallery images"
  on storage.objects for update
  using (
    bucket_id = 'racket-gallery'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own racket gallery images
create policy "Users can delete their own racket gallery images"
  on storage.objects for delete
  using (
    bucket_id = 'racket-gallery'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
