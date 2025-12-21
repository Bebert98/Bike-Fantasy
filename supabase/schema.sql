-- Megabike Supabase schema (Postgres)
-- Apply in Supabase SQL Editor.

create extension if not exists "pgcrypto";

-- Shared updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Access codes (invite-only auth)
create table if not exists public.access_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  is_active boolean not null default true,
  assigned_user_id uuid null,
  created_at timestamptz not null default now()
);

-- Users (one per access code)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  access_code_id uuid not null unique references public.access_codes(id) on delete restrict,
  display_name text not null,
  profile_image_url text null,
  created_at timestamptz not null default now()
);

-- Riders master
create table if not exists public.riders (
  id uuid primary key default gen_random_uuid(),
  pcs_slug text not null unique,
  rider_name text not null,
  team_name text null,
  nationality text null,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create trigger riders_set_updated_at
before update on public.riders
for each row execute function public.set_updated_at();

create index if not exists riders_name_trgm_idx on public.riders using gin (rider_name gin_trgm_ops);

-- Enable trigram ops extension support (Supabase has it on by default in many projects,
-- but gin_trgm_ops requires pg_trgm; create it if missing).
create extension if not exists "pg_trgm";

-- Rider prices per season
create table if not exists public.rider_prices (
  season_year int not null,
  rider_id uuid not null references public.riders(id) on delete cascade,
  price int not null check (price >= 0),
  created_at timestamptz not null default now(),
  primary key (season_year, rider_id)
);

create index if not exists rider_prices_season_idx on public.rider_prices(season_year);

-- Rider points per season (updated daily)
create table if not exists public.rider_points (
  season_year int not null,
  rider_id uuid not null references public.riders(id) on delete cascade,
  points int not null default 0 check (points >= 0),
  updated_at timestamptz not null default now(),
  primary key (season_year, rider_id)
);

create trigger rider_points_set_updated_at
before update on public.rider_points
for each row execute function public.set_updated_at();

-- Teams (one per user per season)
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  season_year int not null,
  team_name text not null,
  total_cost int not null default 0 check (total_cost >= 0),
  points int not null default 0 check (points >= 0),
  locked boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, season_year)
);

create index if not exists teams_season_points_idx on public.teams(season_year, points desc);

-- Team composition
create table if not exists public.team_riders (
  team_id uuid not null references public.teams(id) on delete cascade,
  rider_id uuid not null references public.riders(id) on delete restrict,
  slot int not null check (slot >= 1 and slot <= 30),
  primary key (team_id, slot),
  unique (team_id, rider_id)
);

-- Seasons / hall of fame podium
create table if not exists public.seasons (
  season_year int primary key,
  winner text not null,
  second text not null,
  third text not null
);

-- Races and results (for "Latest race" and audit)
create table if not exists public.races (
  id uuid primary key default gen_random_uuid(),
  pcs_slug text not null unique,
  name text not null,
  race_date date not null,
  updated_at timestamptz not null default now()
);

create trigger races_set_updated_at
before update on public.races
for each row execute function public.set_updated_at();

create index if not exists races_date_idx on public.races(race_date desc);

create table if not exists public.race_results (
  race_id uuid not null references public.races(id) on delete cascade,
  rider_id uuid not null references public.riders(id) on delete restrict,
  rank int not null check (rank >= 1),
  points_awarded int not null default 0 check (points_awarded >= 0),
  primary key (race_id, rider_id)
);

create index if not exists race_results_race_rank_idx on public.race_results(race_id, rank asc);


