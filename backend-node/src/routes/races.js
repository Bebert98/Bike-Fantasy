import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

router.get("/latest", async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);

  // Latest race: date <= today, order desc
  const { data: race, error: raceErr } = await supabase
    .from("races")
    .select("id, name, race_date")
    .lte("race_date", today)
    .order("race_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (raceErr) return res.status(500).json({ error: "DB error" });
  if (!race) return res.json(null);

  const { data: results, error: resultsErr } = await supabase
    .from("race_results")
    .select("rank, points_awarded, riders!inner(rider_name, team_name)")
    .eq("race_id", race.id)
    .order("rank", { ascending: true })
    .limit(50);

  if (resultsErr) return res.status(500).json({ error: "DB error" });

  return res.json({
    name: race.name,
    date: race.race_date,
    results: (results ?? []).map((row) => ({
      rider: row.riders.rider_name,
      team: row.riders.team_name ?? "",
      points: row.points_awarded ?? 0,
      rank: row.rank,
    })),
  });
});

router.get("/next", async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);

  // Next race: date > today, order asc
  const { data: race, error: raceErr } = await supabase
    .from("races")
    .select("id, name, race_date")
    .gt("race_date", today)
    .order("race_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (raceErr) return res.status(500).json({ error: "DB error" });
  if (!race) return res.json(null);

  return res.json({
    name: race.name,
    date: race.race_date,
  });
});

export default router;


