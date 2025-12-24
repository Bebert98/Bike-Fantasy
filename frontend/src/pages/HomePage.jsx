import React from "react";
import "../styles/HomePage.css";
import philippeGilbertImage from "../assets/philippe_gilbert.png";
import { debugLog } from "../services/debug";
import { getLatestRace, getNextRace } from "../services/api";

const HomePage = () => {
    const [latestRace, setLatestRace] = React.useState(null);
    const [nextRace, setNextRace] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                setError(null);

                if (!mounted) return;
                if (!mounted) return;
                const [latest, next] = await Promise.all([
                    getLatestRace(),
                    getNextRace(),
                ]);
                setLatestRace(latest);
                setNextRace(next);
                debugLog("Home loaded", { latest, next });
            } catch (e) {
                if (!mounted) return;
                setError(e?.message ?? "Failed to load home data");
                debugLog("Home load error", e?.message ?? e);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    return (
        <div className="homepage-container">
            <div className="hero-image">
                <img src={philippeGilbertImage} alt="Philippe Gilbert Victory" />
            </div>

            <h1>Mega Bike</h1>
            <h3>since 2004...</h3>

            <div className="content-container">

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Latest Race */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-bold text-slate-800">Latest Race</h2>
                        {loading && <p className="text-slate-500">Loading…</p>}
                        {error && <p className="text-red-600">{error}</p>}
                        {!loading && !latestRace && (
                            <p className="text-slate-500">No race results available yet.</p>
                        )}
                        {!!latestRace && (
                            <div>
                                <div className="mb-4">
                                    <div className="font-semibold text-slate-900">{latestRace.name}</div>
                                    <div className="text-sm text-slate-500">{latestRace.date}</div>
                                </div>
                                {Array.isArray(latestRace.results) && latestRace.results.length > 0 ? (
                                    <ol className="space-y-2 text-sm">
                                        {latestRace.results.slice(0, 5).map((row, idx) => (
                                            <li key={idx} className="flex justify-between border-b pb-1 last:border-0 hover:bg-slate-50">
                                                <span>{idx + 1}. {row.rider} <span className="text-xs text-slate-400">({row.team})</span></span>
                                                <span className="font-medium">{row.points}</span>
                                            </li>
                                        ))}
                                    </ol>
                                ) : (
                                    <p className="text-sm text-slate-500">No results yet.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Next Race */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-bold text-slate-800">Next Race</h2>
                        {loading && <p className="text-slate-500">Loading…</p>}
                        {!loading && !nextRace && (
                            <p className="text-slate-500">No upcoming races found.</p>
                        )}
                        {!!nextRace && (
                            <div>
                                <div className="text-xl font-bold text-blue-600">{nextRace.name}</div>
                                <div className="mt-2 text-slate-600">{nextRace.date}</div>
                                <div className="mt-4 rounded-md bg-blue-50 p-4 text-sm text-blue-800">
                                    Get your team ready!
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;