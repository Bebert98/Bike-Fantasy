import React from "react";
import { getHistory } from "../services/api";
import { debugLog } from "../services/debug";

const fallbackPodium = [
    { year: 2004, winner: "Maximilien", second: "Fabrice", third: "Jean-Christophe" },
    { year: 2005, winner: "Patrice", second: "Fabrice", third: "Dominique" },
    { year: 2006, winner: "Maximilien", second: "Dominique", third: "Fabrice" },
    { year: 2007, winner: "Jean-Christophe", second: "Damien", third: "Harold" },
    { year: 2008, winner: "Maximilien", second: "Jean-Christophe", third: "Pierre-Jean" },
    { year: 2009, winner: "Harold", second: "Damien", third: "Dominique" },
    { year: 2010, winner: "Maximilien", second: "Damien", third: "Dominique" },
    { year: 2011, winner: "Maximilien", second: "Patrice", third: "Harold" },
    { year: 2012, winner: "Damien", second: "Harold", third: "Dominique" },
    { year: 2013, winner: "Harold", second: "Dominique", third: "Jean-Christophe" },
    { year: 2014, winner: "Damien", second: "Patrice", third: "Maximilien" },
    { year: 2015, winner: "Harold", second: "Maximilien", third: "Antoine" },
    { year: 2016, winner: "Damien", second: "Antoine", third: "Dominique" },
    { year: 2017, winner: "Damien", second: "Harold", third: "Antoine" },
    { year: 2018, winner: "Antoine", second: "Pierre-Gilles", third: "Jean-Christophe" },
    { year: 2019, winner: "Antoine", second: "Harold", third: "Jean-Christophe" },
    { year: 2020, winner: "Bernard", second: "Jean-Christophe", third: "Brice" },
    { year: 2021, winner: "Olivier (Jo)", second: "Antoine", third: "Albert" },
    { year: 2022, winner: "Felix", second: "Jack", third: "Albert" },
    { year: 2023, winner: "Adrien", second: "Jack", third: "Dominique" },
    { year: 2024, winner: "Albert", second: "Jack", third: "Dominique" },
];

export default function HistoryPage() {
    const [podium, setPodium] = React.useState(fallbackPodium);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await getHistory();
                const next = Array.isArray(res?.podium) && res.podium.length ? res.podium : fallbackPodium;
                if (!mounted) return;
                setPodium(next);
                debugLog("History loaded", res);
            } catch (e) {
                if (!mounted) return;
                setError(e?.message ?? "Failed to load podium history");
                debugLog("History load error", e?.message ?? e);
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
                <h1 className="text-2xl font-semibold">Podium History</h1>
                <p className="mt-1 text-slate-600">Hall of Fame since 2004.</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                {loading ? <div className="text-sm text-slate-600">Loading…</div> : null}
                {error ? <div className="text-sm text-red-700">{error}</div> : null}

                {!loading && !error ? (
                    <div className="overflow-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-left text-slate-500">
                                    <th className="py-2 pr-4">Year</th>
                                    <th className="py-2 pr-4">Winner</th>
                                    <th className="py-2 pr-4">2nd</th>
                                    <th className="py-2 pr-4">3rd</th>
                                </tr>
                            </thead>
                            <tbody>
                                {podium.map((entry) => (
                                    <tr key={entry.year} className="border-b border-slate-100">
                                        <td className="py-2 pr-4">{entry.year}</td>
                                        <td className="py-2 pr-4">{entry.winner}</td>
                                        <td className="py-2 pr-4">{entry.second}</td>
                                        <td className="py-2 pr-4">{entry.third}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : null}
            </div>
        </div>
    );
}


