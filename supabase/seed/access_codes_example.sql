-- Example access codes (replace with your own; keep these secret if you deploy them)
-- For real usage: generate N UUIDs/codes and insert them here or via a script.

insert into public.access_codes (code, is_active) values
  ('DEMO-ALPHA', true),
  ('DEMO-BRAVO', true),
  ('DEMO-CHARLIE', true)
on conflict (code) do nothing;


