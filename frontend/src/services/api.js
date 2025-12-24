import { createClient } from "@supabase/supabase-js";
import { debugLog } from "./debug";

// --- ENV & CONFIG ---
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const OFFLINE_MODE = process.env.REACT_APP_OFFLINE === "true";

// Used for local state management (JWT)
const TOKEN_STORAGE_KEY = "megabike_token";
const MOCK_USER_KEY = "megabike_mock_user";
const MOCK_TEAM_KEY = "megabike_mock_team";

if (!OFFLINE_MODE && (!SUPABASE_URL || !SUPABASE_ANON_KEY)) {
  console.warn("Missing REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_ANON_KEY");
}

export const supabase = !OFFLINE_MODE
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export function getAuthToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAuthToken(token) {
  if (!token) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    // Clear global header
    if (supabase) supabase.auth.setSession(null);
  } else {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    // Supabase JS doesn't support 'injecting' a custom JWT easily for the main auth session 
    // without using setSession with a refresh token, BUT for simple REST calls via the client,
    // we can set the global headers manually or just rely on the fact that we're doing
    // direct DB calls.

    // IMPORTANT: For "Access Code" Custom Auth, we usually treat the token as a Bearer
    // for RLS. The Supabase client allows setting the access token manually:
    if (supabase) {
      supabase.functions.setAuth(token); // For Edge Functions
      supabase.realtime.setAuth(token);  // For Realtime
      // For standard DB queries, we override the header in the query or set it globally:
      supabase.headers['Authorization'] = `Bearer ${token}`;
    }
  }
}

// Sync token on load
const savedToken = getAuthToken();
if (savedToken) setAuthToken(savedToken);


// --- API FUNCTIONS ---

// 1. Auth: Calls Serverless Function /api/verify-code
export async function verifyAccessCode(accessCode) {
  if (OFFLINE_MODE) return mockLogin(accessCode);

  try {
    const res = await fetch("/api/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessCode }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Login failed");
    }

    const data = await res.json();
    setAuthToken(data.token);
    return data; // { token, user: { id, displayName... } }
  } catch (err) {
    debugLog("verifyAccessCode error", err);
    throw err;
  }
}

// 2. User Profile: Supabase Direct
export async function getMe() {
  if (OFFLINE_MODE) return mockGetMe();

  const { data: { user } } = await supabase.auth.getUser();
  // Wait, we are using custom auth, not Supabase Auth email/password. 
  // The 'user' is stored in the JWT `sub`.
  // We can just fetch the user row by ID using the current token's RLS.

  // Actually, simplest is to query public.users. 
  // RLS "Users can view own profile" ensures we only see ours if we select by ID
  // or just select * limit 1 if policy enforces it.

  // However, we need the user's ID. It's in the JWT, or we can look it up.
  // We'll assume the client 'session' isn't fully managed by supabase.auth, 
  // so we fetch the user assuming the token is valid.

  // NOTE: With custom tokens, `supabase.auth.getUser()` might not work unless we use `setSession`.
  // Let's rely on the response from verifyAccessCode keeping the user object, or fetch from DB.

  // Fetch from DB using the auth context (RLS relies on the token we set).
  // We don't know the ID easily without parsing JWT. 
  // Strategy: The RLS policy "Users can view own profile" uses `auth.uid()`.
  // So `select * from users` should return ONLY the user's row.

  const { data, error } = await supabase
    .from("users")
    .select("id, display_name, profile_image_url")
    .single();

  if (error) throw error;

  return {
    id: data.id,
    displayName: data.display_name,
    profileImageUrl: data.profile_image_url
  };
}

export async function updateMe(payload) {
  if (OFFLINE_MODE) return mockUpdateMe(payload);

  const updates = {};
  if (payload.displayName) updates.display_name = payload.displayName;
  if (payload.profileImageUrl !== undefined) updates.profile_image_url = payload.profileImageUrl;

  // RLS will enforce we can only update our own row.
  // We need to target the row. since we don't have the ID handy, we can try matching auth.uid()
  // But standard update requires a WHERE clause usually.

  // Workaround: We fetch the user first (which works via RLS) then update by ID.
  const { data: me } = await supabase.from("users").select("id").single();

  if (!me) throw new Error("User not found");

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", me.id)
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    displayName: data.display_name,
    profileImageUrl: data.profile_image_url
  };
}


// 3. Races: Public Read
export async function getLatestRace() {
  if (OFFLINE_MODE) return mockLatestRace();

  const today = new Date().toISOString().slice(0, 10);

  // Latest race
  const { data: race, error: raceErr } = await supabase
    .from("races")
    .select("id, name, race_date")
    .lte("race_date", today)
    .order("race_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (raceErr) throw raceErr;
  if (!race) return null;

  // Results
  const { data: results, error: resErr } = await supabase
    .from("race_results")
    .select("rank, points_awarded, riders(rider_name, team_name)")
    .eq("race_id", race.id)
    .order("rank", { ascending: true })
    .limit(50);

  if (resErr) throw resErr;

  return {
    name: race.name,
    date: race.race_date,
    results: (results || []).map(r => ({
      rider: r.riders?.rider_name,
      team: r.riders?.team_name ?? "",
      points: r.points_awarded,
      rank: r.rank
    }))
  };
}

export async function getNextRace() {
  if (OFFLINE_MODE) return mockNextRace();

  const today = new Date().toISOString().slice(0, 10);
  const { data: race, error } = await supabase
    .from("races")
    .select("id, name, race_date")
    .gt("race_date", today)
    .order("race_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!race) return null;

  return {
    name: race.name,
    date: race.race_date
  };
}


// 4. Teams & Leaderboard
export async function getMyTeam() {
  if (OFFLINE_MODE) return mockMyTeam();

  const { data: me } = await supabase.from("users").select("id").single();
  if (!me) return null;

  // TODO: support current season dynamic
  const season = 2025;

  const { data: team, error } = await supabase
    .from("teams")
    .select("*")
    .eq("user_id", me.id)
    .eq("season_year", season)
    .maybeSingle();

  if (error) throw error;
  if (!team) return null;

  // Fetch riders
  const { data: teamRiders } = await supabase
    .from("team_riders")
    .select("slot, riders(id, rider_name, team_name, nationality, active)")
    .eq("team_id", team.id);

  // Format response to match expected frontend structure
  return {
    id: team.id,
    teamName: team.team_name,
    totalPrice: team.total_cost,
    points: team.points,
    riders: (teamRiders || []).map(tr => ({
      ...tr.riders,
      price: 0 // Price lookup would be in rider_prices if needed
    }))
  };
}

export async function createMyTeam(payload) {
  // This is complex because it involves transaction-like inserts (Team + TeamRiders).
  // Safest to do via a Postgres Function (RPC) or detailed implementation here.
  // For now, let's just throw an error saying "Contact Admin" or assume this is managed elsewhere
  // as implementing the full Team Creation logic in frontend-only requires careful handling.
  // OR we create a Serverless Function for this complex write operation.

  throw new Error("Team creation not yet fully ported to Serverless. Please wait.");
}

export async function getCurrentLeaderboard() {
  if (OFFLINE_MODE) return mockLeaderboard();

  const season = 2025;
  const { data, error } = await supabase
    .from("teams")
    .select("id, team_name, points, users(display_name)")
    .eq("season_year", season)
    .order("points", { ascending: false })
    .limit(200);

  if (error) throw error;

  return {
    teams: data.map(t => ({
      id: t.id,
      teamName: t.team_name,
      points: t.points,
      ownerName: t.users?.display_name
    }))
  };
}

export async function getTeamById(teamId) {
  // Similar implementation to getMyTeam but by ID
  return null; // Impl deferred
}

export async function autocompleteRiders(query) {
  if (OFFLINE_MODE) return [];

  const { data, error } = await supabase
    .from("riders")
    .select("*")
    .ilike("rider_name", `%${query}%`)
    .limit(10);

  if (error) return [];
  return data;
}

export async function getHistory() {
  // Simple fetch from 'seasons' table
  const { data } = await supabase.from("seasons").select("*").order("season_year", { ascending: false });
  // adapt to frontend expected format...
  return { podium: [], mostTitles: [] }; // placeholder
}


// --- MOCKS (Offline Mode) ---
function mockLogin(code) {
  const user = { id: "mock", displayName: code, profileImageUrl: null };
  setAuthToken("mock-token");
  return Promise.resolve({ token: "mock-token", user });
}
function mockGetMe() { return Promise.resolve({ id: "mock", displayName: "Mock User", profileImageUrl: null }); }
function mockUpdateMe(p) { return Promise.resolve({ id: "mock", displayName: p.displayName, profileImageUrl: p.profileImageUrl }); }
function mockLatestRace() { return Promise.resolve({ name: "Mock Race", date: "2025-01-01", results: [] }); }
function mockNextRace() { return Promise.resolve({ name: "Next Mock", date: "2025-02-01" }); }
function mockMyTeam() { return Promise.resolve(null); }
function mockLeaderboard() { return Promise.resolve({ teams: [] }); }