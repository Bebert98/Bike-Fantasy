import express from "express";
import { supabase } from "../supabase.js";
import { nowSeasonYear } from "../utils.js";

const router = express.Router();

router.get("/current", async (req, res) => {
  const seasonYear = nowSeasonYear();

  const { data, error } = await supabase
    .from("teams")
    .select("id, team_name, points, users(display_name)")
    .eq("season_year", seasonYear)
    .order("points", { ascending: false })
    .limit(200);

  if (error) return res.status(500).json({ error: "DB error" });

  return res.json({
    teams: (data ?? []).map((t) => ({
      id: t.id,
      teamName: t.team_name,
      points: t.points ?? 0,
      ownerName: t.users?.display_name,
    })),
  });
});

export default router;


