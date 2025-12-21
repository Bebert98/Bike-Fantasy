import React from "react";
import RiderPicker from "./RiderPicker";
import { debugLog } from "../services/debug";

const DEFAULT_SLOTS = 12;
const BUDGET = 11000;

function calcTotal(riders) {
    return riders.reduce((sum, r) => sum + (r?.price ?? r?.points ?? 0), 0);
}

export default function TeamBuilder({ onSubmit, isSubmitting }) {
    const [teamName, setTeamName] = React.useState("");
    const [slots, setSlots] = React.useState(Array(DEFAULT_SLOTS).fill(null));
    const [error, setError] = React.useState(null);

    const total = calcTotal(slots.filter(Boolean));
    const remaining = BUDGET - total;

    function setSlot(index, rider) {
        const next = [...slots];
        next[index] = rider;
        setSlots(next);
    }

    function validate() {
        if (teamName.trim().length < 2) return "Team name is required.";
        if (slots.some((s) => !s)) return "Please pick all riders.";
        const names = slots.map((s) => s?.rider_name);
        const unique = new Set(names);
        if (unique.size !== names.length) return "Each rider must be unique.";
        if (total > BUDGET) return `Budget exceeded by ${Math.abs(remaining)}.`;
        return null;
    }

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Create your team</h2>
                    <p className="text-sm text-slate-600">
                        You can create your team once. Budget: {BUDGET}.
                    </p>
                </div>
                <div className="text-sm">
                    <span className="text-slate-500">Remaining:</span>{" "}
                    <span className={remaining < 0 ? "font-semibold text-red-700" : "font-semibold text-slate-900"}>
                        {remaining}
                    </span>
                </div>
            </div>

            <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700">
                    Team name
                </label>
                <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. Team Gilbert"
                />
            </div>

            <div className="mt-5 space-y-3">
                {slots.map((r, idx) => (
                    <div key={idx} className="grid grid-cols-1 gap-2 sm:grid-cols-12 sm:items-center">
                        <div className="text-xs font-medium text-slate-500 sm:col-span-1">
                            #{idx + 1}
                        </div>
                        <div className="sm:col-span-8">
                            <RiderPicker
                                value={r}
                                disabled={isSubmitting}
                                onChange={(picked) => setSlot(idx, picked)}
                            />
                        </div>
                        <div className="text-sm text-slate-600 sm:col-span-3 sm:text-right">
                            Cost: {r ? (r.price ?? r.points ?? 0) : "—"}
                        </div>
                    </div>
                ))}
            </div>

            {error ? <div className="mt-4 text-sm text-red-700">{error}</div> : null}

            <div className="mt-5 flex gap-3">
                <button
                    type="button"
                    disabled={isSubmitting}
                    className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    onClick={() => {
                        const msg = validate();
                        setError(msg);
                        if (msg) return;
                        const payload = {
                            teamName: teamName.trim(),
                            riders: slots.map((r) => ({
                                rider_name: r.rider_name,
                            })),
                        };
                        debugLog("Submitting team", payload);
                        onSubmit?.(payload);
                    }}
                >
                    {isSubmitting ? "Creating…" : "Create team (locked)"}
                </button>
            </div>
        </div>
    );
}


