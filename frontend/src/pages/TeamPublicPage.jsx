import React from "react";
import { Link, useParams } from "react-router-dom";
import { getTeamById } from "../services/api";
import { debugLog } from "../services/debug";

export default function TeamPublicPage() {
    const { teamId } = useParams();
    const [team, setTeam] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await getTeamById(teamId);
                if (!mounted) return;
                setTeam(res);
                debugLog("Public team loaded", res);
            } catch (e) {
                if (!mounted) return;
                setError("Failed to load team.");
                debugLog("Public team error", e?.message ?? e);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [teamId]);

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold">
                        {team?.teamName ?? "Team"}
                    </h1>
                    <p className="mt-1 text-slate-600">
                        Season {team?.season ?? "—"} · Points {team?.points ?? 0} · Cost{" "}
                        {team?.totalPrice ?? 0}
                    </p>
                </div>
                <Link className="text-sm text-blue-700 hover:underline" to="/leaderboard">
                    ← Back to leaderboard
                </Link>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                {loading ? <div className="text-sm text-slate-600">Loading…</div> : null}
                {error ? <div className="text-sm text-red-700">{error}</div> : null}

                {!loading && !error ? (
                    <div className="overflow-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-left text-slate-500">
                                    <th className="py-2 pr-4">#</th>
                                    <th className="py-2 pr-4">Rider</th>
                                    <th className="py-2 pr-4 text-right">Price</th>
                                    <th className="py-2 pr-4 text-right">Points</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(team?.riders ?? []).map((r, idx) => (
                                    <tr key={`${r.rider_name ?? "rider"}-${idx}`} className="border-b border-slate-100">
                                        <td className="py-2 pr-4">{r.slot ?? idx + 1}</td>
                                        <td className="py-2 pr-4">{r.rider_name}</td>
                                        <td className="py-2 pr-4 text-right">{r.price ?? 0}</td>
                                        <td className="py-2 pr-4 text-right">{r.points ?? 0}</td>
                                    </tr>
                                ))}
                                {(team?.riders ?? []).length === 0 ? (
                                    <tr>
                                        <td className="py-4 text-sm text-slate-600" colSpan={4}>
                                            No riders found.
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


