import express from "express";
import { supabase } from "../supabase.js";
import { nowSeasonYear } from "../utils.js";

const router = express.Router();

router.get("/autocomplete", async (req, res) => {
  const qRaw = String(req.query.query ?? "").trim();
  if (qRaw.length < 2) return res.json([]);

  const seasonYear = nowSeasonYear();

  // Simple ilike for small scale. (We created a trigram index too for speed later.)
  const { data, error } = await supabase
    .from("riders")
    .select(
      "id, rider_name, rider_prices!inner(season_year, price)"
    )
    .ilike("rider_name", `%${qRaw}%`)
    .limit(10);

  if (error) return res.status(500).json({ error: "DB error" });

  // Shape matches frontend: { rider_name, price } (keep points field optional for legacy)
  const out = (data ?? [])
    .map((row) => ({
      rider_name: row.rider_name,
      price: Array.isArray(row?.rider_prices)
        ? row.rider_prices.find((p) => p.season_year === seasonYear)?.price ?? 0
        : 0,
    }))
    .slice(0, 10);

  return res.json(out);
});

export default router;


