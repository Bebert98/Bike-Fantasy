import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const { data: podium, error } = await supabase
    .from("seasons")
    .select("season_year, winner, second, third")
    .order("season_year", { ascending: false });

  if (error) return res.status(500).json({ error: "DB error" });

  // mostTitles: computed client-side previously; provide a simple count-based list here
  const counts = new Map();
  for (const row of podium ?? []) {
    counts.set(row.winner, (counts.get(row.winner) ?? 0) + 1);
  }
  const mostTitles = Array.from(counts.entries())
    .map(([name, titles]) => ({ name, titles }))
    .sort((a, b) => b.titles - a.titles)
    .slice(0, 10);

  return res.json({
    podium: (podium ?? []).map((r) => ({
      year: r.season_year,
      winner: r.winner,
      second: r.second,
      third: r.third,
    })),
    mostTitles,
  });
});

export default router;


