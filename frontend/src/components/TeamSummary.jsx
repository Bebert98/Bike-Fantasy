import React from "react";

export default function TeamSummary({ me, team, onLogout }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {team?.teamName ?? "Your team"}
            </h2>
            <div className="text-sm text-slate-600">
              Logged in as: {me?.displayName ?? me?.id ?? "user"}
            </div>
          </div>
          <button
            type="button"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            onClick={onLogout}
          >
            Log out
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Points
            </div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">
              {team?.points ?? 0}
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Total cost
            </div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">
              {team?.totalPrice ?? 0}
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Season
            </div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">
              {team?.season ?? "—"}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Riders</h3>
        <div className="mt-3 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 pr-4">#</th>
                <th className="py-2 pr-4">Rider</th>
                <th className="py-2 pr-4 text-right">Points</th>
                <th className="py-2 pr-4 text-right">Cost</th>
              </tr>
            </thead>
            <tbody>
              {(team?.riders ?? []).map((r, idx) => (
                <tr key={`${r.rider_name}-${idx}`} className="border-b border-slate-100">
                  <td className="py-2 pr-4">{idx + 1}</td>
                  <td className="py-2 pr-4">{r.rider_name}</td>
                  <td className="py-2 pr-4 text-right">{r.points ?? 0}</td>
                  <td className="py-2 pr-4 text-right">{r.price ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-xs text-slate-500">
          This team is locked after creation.
        </div>
      </div>
    </div>
  );
}


