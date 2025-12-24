-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.teams enable row level security;
alter table public.team_riders enable row level security;
alter table public.riders enable row level security;
alter table public.rider_prices enable row level security;
alter table public.rider_points enable row level security;
alter table public.races enable row level security;
alter table public.race_results enable row level security;
alter table public.seasons enable row level security;
alter table public.access_codes enable row level security;

-- USERS
-- Users can see their own profile
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

-- (Optional) Users can view other users (for leaderboards). currently we replicate display_name to teams
create policy "Users can view all profiles" on public.users
  for select using (true);


-- TEAMS
-- Public can view all teams (for leaderboard)
create policy "Public teams view" on public.teams
  for select using (true);

-- Users can create a team (if they are the owner)
create policy "Users can create own team" on public.teams
  for insert with check (auth.uid() = user_id);

-- Users can update their own team (if not locked? - logic handled in app/triggers usually, but for now RLS)
create policy "Users can update own team" on public.teams
  for update using (auth.uid() = user_id);


-- TEAM RIDERS
-- Public view
create policy "Public team riders view" on public.team_riders
  for select using (true);

-- Users can insert riders into their own team
create policy "Users can manage own team riders" on public.team_riders
  for all using (
    exists (
      select 1 from public.teams
      where teams.id = team_riders.team_id
      and teams.user_id = auth.uid()
    )
  );


-- PUBLIC READ-ONLY DATA
-- Riders, Prices, Points, Races, Results, Seasons
create policy "Public read riders" on public.riders for select using (true);
create policy "Public read prices" on public.rider_prices for select using (true);
create policy "Public read points" on public.rider_points for select using (true);
create policy "Public read races" on public.races for select using (true);
create policy "Public read results" on public.race_results for select using (true);
create policy "Public read seasons" on public.seasons for select using (true);


-- ACCESS CODES
-- PRIVATE: Only service role can access. No policies for 'anon' or 'authenticated'.
-- (Implicitly denies access to public users)
