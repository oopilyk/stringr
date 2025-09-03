-- Create extensions
create extension if not exists "uuid-ossp";

-- Create enum types
create type public.user_role as enum ('player', 'stringer');
create type public.request_status as enum ('requested', 'accepted', 'in_progress', 'ready', 'completed', 'canceled');
create type public.payment_status as enum ('unpaid', 'paid', 'refunded');
create type public.dropoff_method as enum ('meetup', 'pickup', 'ship', 'dropbox');

-- Create profiles table (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role public.user_role not null,
  full_name text,
  avatar_url text,
  bio text,
  phone text,
  city text,
  lat double precision,
  lng double precision,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create stringer_settings table
create table public.stringer_settings (
  id uuid primary key references public.profiles(id) on delete cascade,
  base_price_cents integer not null default 2500,
  turnaround_hours integer not null default 24,
  accepts_rush boolean not null default true,
  rush_fee_cents integer not null default 1000,
  max_daily_jobs integer default 4,
  services jsonb default '[]'::jsonb, -- e.g. [{"name":"Restring","price_cents":2500}]
  availability jsonb default '[]'::jsonb, -- e.g. weekly schedule blocks
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
  -- Note: constraint removed due to PostgreSQL subquery limitation in check constraints
  -- We'll enforce this constraint at the application level
);

-- Create requests table
create table public.requests (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.profiles(id),
  stringer_id uuid references public.profiles(id),
  status public.request_status not null default 'requested',
  racquet_brand text,
  racquet_model text,
  string_pref text,       -- e.g. "RPM Blast 17"
  tension_lbs numeric(4,1),    -- 48.0–62.0 typical
  notes text,
  dropoff_method public.dropoff_method default 'meetup',
  address text,
  lat double precision,
  lng double precision,
  quoted_price_cents integer,
  payment_status public.payment_status not null default 'unpaid',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  -- Note: role validation constraints removed due to PostgreSQL subquery limitation
  -- We'll enforce these constraints at the application level
  constraint requests_tension_range check (tension_lbs is null or (tension_lbs >= 30 and tension_lbs <= 80))
);

-- Create messages table
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  body text not null,
  created_at timestamp with time zone default now()
  -- Note: participant validation constraint removed due to PostgreSQL subquery limitation
  -- We'll enforce this constraint at the application level
);

-- Create reviews table
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  request_id uuid unique not null references public.requests(id) on delete cascade,
  player_id uuid not null references public.profiles(id),
  stringer_id uuid not null references public.profiles(id),
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamp with time zone default now()
  -- Note: review validation constraints removed due to PostgreSQL subquery limitation
  -- We'll enforce these constraints at the application level
);

-- Create view for stringer ratings
create view public.stringer_ratings as
select 
  stringer_id,
  avg(rating)::numeric(3,2) as avg_rating,
  count(*)::integer as review_count
from public.reviews
group by stringer_id;

-- Create indexes for performance
create index profiles_role_idx on public.profiles(role);
create index profiles_location_idx on public.profiles(lat, lng) where lat is not null and lng is not null;
create index requests_player_id_idx on public.requests(player_id);
create index requests_stringer_id_idx on public.requests(stringer_id) where stringer_id is not null;
create index requests_status_idx on public.requests(status);
create index requests_created_at_idx on public.requests(created_at);
create index requests_location_idx on public.requests(lat, lng) where lat is not null and lng is not null;
create index messages_request_id_idx on public.messages(request_id);
create index messages_created_at_idx on public.messages(created_at);
create index reviews_stringer_id_idx on public.reviews(stringer_id);

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger stringer_settings_updated_at
  before update on public.stringer_settings
  for each row execute function public.handle_updated_at();

create trigger requests_updated_at
  before update on public.requests
  for each row execute function public.handle_updated_at();

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.stringer_settings enable row level security;
alter table public.requests enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;

-- RLS Policies for profiles
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- RLS Policies for stringer_settings
create policy "Stringer settings are viewable by everyone" on public.stringer_settings
  for select using (true);

create policy "Stringers can insert their own settings" on public.stringer_settings
  for insert with check (auth.uid() = id);

create policy "Stringers can update their own settings" on public.stringer_settings
  for update using (auth.uid() = id);

-- RLS Policies for requests
create policy "Players can view their own requests" on public.requests
  for select using (auth.uid() = player_id);

create policy "Stringers can view their assigned requests" on public.requests
  for select using (auth.uid() = stringer_id);

create policy "Players can insert requests" on public.requests
  for insert with check (auth.uid() = player_id);

create policy "Players can update their own requests" on public.requests
  for update using (auth.uid() = player_id);

create policy "Stringers can update assigned requests" on public.requests
  for update using (auth.uid() = stringer_id);

-- RLS Policies for messages
create policy "Message participants can view messages" on public.messages
  for select using (
    exists (
      select 1 from public.requests r
      where r.id = request_id 
      and (r.player_id = auth.uid() or r.stringer_id = auth.uid())
    )
  );

create policy "Message participants can insert messages" on public.messages
  for insert with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.requests r
      where r.id = request_id 
      and (r.player_id = auth.uid() or r.stringer_id = auth.uid())
    )
  );

-- RLS Policies for reviews
create policy "Reviews are viewable by everyone" on public.reviews
  for select using (true);

create policy "Players can insert reviews for their completed requests" on public.reviews
  for insert with check (
    auth.uid() = player_id and
    exists (
      select 1 from public.requests r
      where r.id = request_id 
      and r.player_id = auth.uid()
      and r.status = 'completed'
    )
  );

-- Create function to calculate distance between two points
create or replace function public.calculate_distance(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns double precision as $$
declare
  earth_radius constant double precision := 6371; -- km
  dlat double precision;
  dlng double precision;
  a double precision;
  c double precision;
begin
  dlat := radians(lat2 - lat1);
  dlng := radians(lng2 - lng1);
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng/2) * sin(dlng/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  return earth_radius * c;
end;
$$ language plpgsql immutable;
