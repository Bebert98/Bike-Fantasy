import express from "express";
import { z } from "zod";
import { supabase } from "../supabase.js";
import { authMiddleware } from "../auth.js";
import { nowSeasonYear } from "../utils.js";

const router = express.Router();

const DEFAULT_SLOTS = 12;
const BUDGET = 11000;

router.get("/me/team", authMiddleware, async (req, res) => {
  const seasonYear = nowSeasonYear();

  const { data: team, error: teamErr } = await supabase
    .from("teams")
    .select("id, team_name, season_year, total_cost, points, created_at")
    .eq("user_id", req.userId)
    .eq("season_year", seasonYear)
    .maybeSingle();

  if (teamErr) return res.status(500).json({ error: "DB error" });
  if (!team) return res.json(null);

  // Load roster + prices + points
  const { data: roster, error: rosterErr } = await supabase
    .from("team_riders")
    .select(
      "slot, riders!inner(rider_name, rider_prices(season_year, price), rider_points(season_year, points))"
    )
    .eq("team_id", team.id)
    .order("slot", { ascending: true });

  if (rosterErr) return res.status(500).json({ error: "DB error" });

  const riders = (roster ?? []).map((row) => {
    const r = row.riders;
    const price = Array.isArray(r?.rider_prices)
      ? r.rider_prices.find((p) => p.season_year === seasonYear)?.price ?? 0
      : 0;
    const points = Array.isArray(r?.rider_points)
      ? r.rider_points.find((p) => p.season_year === seasonYear)?.points ?? 0
      : 0;
    return { rider_name: r.rider_name, price, points, slot: row.slot };
  });

  const computedTeamPoints = riders.reduce((sum, r) => sum + (r.points ?? 0), 0);

  return res.json({
    teamName: team.team_name,
    season: team.season_year,
    riders,
    totalPrice: team.total_cost,
    // Prefer computed points so the UI is correct even if the nightly sync hasn't updated the team row yet.
    points: computedTeamPoints,
    createdAt: team.created_at,
  });
});

router.post("/me/team", authMiddleware, async (req, res) => {
  const schema = z.object({
    teamName: z.string().min(2).max(80),
    riders: z.array(z.object({ rider_name: z.string().min(1) })).length(DEFAULT_SLOTS),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });

  const seasonYear = nowSeasonYear();

  // Ensure user doesn't already have a team this season.
  const { data: existing, error: existingErr } = await supabase
    .from("teams")
    .select("id")
    .eq("user_id", req.userId)
    .eq("season_year", seasonYear)
    .maybeSingle();
  if (existingErr) return res.status(500).json({ error: "DB error" });
  if (existing) return res.status(409).json({ error: "Team already exists (locked)." });

  const names = parsed.data.riders.map((r) => r.rider_name.trim());
  const unique = new Set(names);
  if (unique.size !== names.length) return res.status(400).json({ error: "Riders must be unique." });

  // Resolve rider ids + prices for season.
  const { data: riders, error: ridersErr } = await supabase
    .from("riders")
    .select("id, rider_name, rider_prices(season_year, price)")
    .in("rider_name", names);

  if (ridersErr) return res.status(500).json({ error: "DB error" });

  const byName = new Map();
  for (const r of riders ?? []) byName.set(r.rider_name, r);
  for (const n of names) {
    if (!byName.has(n)) return res.status(400).json({ error: `Unknown rider: ${n}` });
  }

  const rosterWithCosts = names.map((n, idx) => {
    const r = byName.get(n);
    const price = Array.isArray(r?.rider_prices)
      ? r.rider_prices.find((p) => p.season_year === seasonYear)?.price ?? null
      : null;
    if (price === null) {
      // Keep this user-friendly; ingestion should guarantee prices exist.
      return { slot: idx + 1, rider_id: r.id, rider_name: n, price: null };
    }
    return { slot: idx + 1, rider_id: r.id, rider_name: n, price };
  });

  if (rosterWithCosts.some((x) => x.price === null)) {
    return res.status(400).json({ error: `Missing rider price data for season ${seasonYear}.` });
  }

  const totalCost = rosterWithCosts.reduce((sum, x) => sum + x.price, 0);
  if (totalCost > BUDGET) return res.status(400).json({ error: `Budget exceeded by ${totalCost - BUDGET}.` });

  // Create team
  const { data: createdTeam, error: createTeamErr } = await supabase
    .from("teams")
    .insert({
      user_id: req.userId,
      season_year: seasonYear,
      team_name: parsed.data.teamName.trim(),
      total_cost: totalCost,
      points: 0,
      locked: true,
    })
    .select("id, team_name, season_year, total_cost, points, created_at")
    .single();

  if (createTeamErr) return res.status(500).json({ error: "DB error" });

  const teamRidersRows = rosterWithCosts.map((r) => ({
    team_id: createdTeam.id,
    rider_id: r.rider_id,
    slot: r.slot,
  }));

  const { error: insertRosterErr } = await supabase.from("team_riders").insert(teamRidersRows);
  if (insertRosterErr) return res.status(500).json({ error: "DB error" });

  // Compute initial team points from existing rider_points (so teams don't show 0 until the next daily sync).
  const riderIds = rosterWithCosts.map((r) => r.rider_id);
  const { data: ptsRows, error: ptsErr } = await supabase
    .from("rider_points")
    .select("rider_id, points")
    .eq("season_year", seasonYear)
    .in("rider_id", riderIds);
  if (ptsErr) return res.status(500).json({ error: "DB error" });
  const totalPoints = (ptsRows ?? []).reduce((sum, r) => sum + (r.points ?? 0), 0);

  // Persist points so leaderboard is correct immediately.
  await supabase.from("teams").update({ points: totalPoints }).eq("id", createdTeam.id);

  return res.status(201).json({
    teamName: createdTeam.team_name,
    season: createdTeam.season_year,
    riders: rosterWithCosts.map((r) => ({ rider_name: r.rider_name, price: r.price })),
    totalPrice: createdTeam.total_cost,
    points: totalPoints,
    createdAt: createdTeam.created_at,
  });
});

export default router;


