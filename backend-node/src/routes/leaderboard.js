import express from "express";
import { supabase } from "../supabase.js";
import { nowSeasonYear } from "../utils.js";

const router = express.Router();

router.get("/current", async (req, res) => {
  const seasonYear = nowSeasonYear();

  const { data, error } = await supabase
    .from("teams")
    .select("team_name, points")
    .eq("season_year", seasonYear)
    .order("points", { ascending: false })
    .limit(200);

  if (error) return res.status(500).json({ error: "DB error" });

  return res.json({
    teams: (data ?? []).map((t) => ({ teamName: t.team_name, points: t.points ?? 0 })),
  });
});

export default router;


