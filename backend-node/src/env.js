import dotenv from "dotenv";

dotenv.config();

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const env = {
  port: Number(process.env.PORT ?? "8000"),
  supabaseUrl: requireEnv("SUPABASE_URL"),
  supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  jwtSecret: requireEnv("MEGABIKE_JWT_SECRET"),
  adminKey: process.env.MEGABIKE_ADMIN_KEY ?? null,
};


