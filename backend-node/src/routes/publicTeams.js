import express from "express";
import { supabase } from "../supabase.js";
import { nowSeasonYear } from "../utils.js";

const router = express.Router();

// Public: view a team by id (used for "view other teams" from leaderboard)
router.get("/:teamId", async (req, res) => {
    const teamId = String(req.params.teamId || "").trim();
    if (!teamId) return res.status(400).json({ error: "Missing team id" });

    const seasonYear = Number(req.query.season) || nowSeasonYear();

    const { data: team, error: teamErr } = await supabase
        .from("teams")
        .select("id, team_name, season_year, total_cost, points, created_at")
        .eq("id", teamId)
        .maybeSingle();

    if (teamErr) return res.status(500).json({ error: "DB error" });
    if (!team) return res.status(404).json({ error: "Team not found" });

    // Load roster + prices + points (for requested season)
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
        id: team.id,
        teamName: team.team_name,
        season: team.season_year,
        riders,
        totalPrice: team.total_cost,
        points: computedTeamPoints,
        createdAt: team.created_at,
    });
});

export default router;


