import React from "react";
import { Link } from "react-router-dom";
import { getCurrentLeaderboard } from "../services/api";
import { debugLog } from "../services/debug";

export default function LeaderboardPage() {
    const [rows, setRows] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await getCurrentLeaderboard();
                if (!mounted) return;
                setRows(Array.isArray(res?.teams) ? res.teams : Array.isArray(res) ? res : []);
                debugLog("Leaderboard loaded", res);
            } catch (e) {
                if (!mounted) return;
                setError("Failed to load leaderboard (or backend not running yet).");
                debugLog("Leaderboard error", e?.message ?? e);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-semibold">Leaderboard</h1>
                <p className="mt-1 text-slate-600">
                    Current season standings (points are updated by the scoring API).
                </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                {loading ? <div className="text-sm text-slate-600">Loading…</div> : null}
                {error ? <div className="text-sm text-red-700">{error}</div> : null}

                {!loading && !error ? (
                    <div className="overflow-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-left text-slate-500">
                                    <th className="py-2 pr-4">Rank</th>
                                    <th className="py-2 pr-4">Team</th>
                                    <th className="py-2 pr-4 text-right">Points</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((t, idx) => (
                                    <tr
                                        key={`${t.id ?? t.team_name ?? t.teamName ?? "team"}-${idx}`}
                                        className="border-b border-slate-100"
                                    >
                                        <td className="py-2 pr-4">{idx + 1}</td>
                                        <td className="py-2 pr-4">
                                            <div>
                                                {t.id ? (
                                                    <Link
                                                        className="block text-blue-700 hover:underline"
                                                        to={`/team/${t.id}`}
                                                    >
                                                        {t.team_name ?? t.teamName}
                                                    </Link>
                                                ) : (
                                                    <div className="block">
                                                        {t.team_name ?? t.teamName}
                                                    </div>
                                                )}
                                                {t.ownerName ? (
                                                    <div className="text-xs text-slate-500">
                                                        {t.ownerName}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </td>
                                        <td className="py-2 pr-4 text-right">{t.points ?? 0}</td>
                                    </tr>
                                ))}
                                {rows.length === 0 ? (
                                    <tr>
                                        <td className="py-4 text-sm text-slate-600" colSpan={3}>
                                            No teams yet.
                                        </td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>
                ) : null}
            </div>
        </div>
    );
}


