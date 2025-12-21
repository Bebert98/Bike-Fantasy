import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

// Server-side client: uses Service Role key (must never be exposed to the browser)
export const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});


