import React from "react";
import AccessCodeForm from "../components/AccessCodeForm";
import TeamBuilder from "../components/TeamBuilder";
import TeamSummary from "../components/TeamSummary";
import { debugLog } from "../services/debug";
import {
  createMyTeam,
  getMe,
  getMyTeam,
  getAuthToken,
  setAuthToken,
  verifyAccessCode,
} from "../services/api";

export default function MyTeamPage() {
  const [token, setToken] = React.useState(getAuthToken());
  const [me, setMe] = React.useState(null);
  const [team, setTeam] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const authed = !!token;

  async function loadAuthed() {
    setLoading(true);
    setError(null);
    try {
      const [meRes, teamRes] = await Promise.allSettled([getMe(), getMyTeam()]);
      const nextMe = meRes.status === "fulfilled" ? meRes.value : null;
      const nextTeam = teamRes.status === "fulfilled" ? teamRes.value : null;
      setMe(nextMe);
      setTeam(nextTeam);
      debugLog("MyTeam loaded", { nextMe, nextTeam });
    } catch (e) {
      setError(e?.message ?? "Failed to load your team");
      debugLog("MyTeam load error", e?.message ?? e);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    if (authed) loadAuthed();
  }, [authed]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Team</h1>
        <p className="mt-1 text-slate-600">
          Create your team once (budget 11,000) and track points for the current
          season.
        </p>
      </div>

      {!authed ? (
        <AccessCodeForm
          isLoading={loading}
          error={error}
          onSubmit={async (accessCode) => {
            if (!accessCode) return;
            setLoading(true);
            setError(null);
            try {
              const res = await verifyAccessCode(accessCode);
              setAuthToken(res.token);
              setToken(res.token);
              debugLog("Verified access code", res.user);
            } catch (e) {
              setError("Invalid code (or backend not running yet).");
              debugLog("verifyAccessCode error", e?.message ?? e);
            } finally {
              setLoading(false);
            }
          }}
        />
      ) : team ? (
        <TeamSummary
          me={me}
          team={team}
          onLogout={() => {
            setAuthToken(null);
            setToken(null);
            setMe(null);
            setTeam(null);
          }}
        />
      ) : (
        <TeamBuilder
          isSubmitting={loading}
          onSubmit={async (payload) => {
            setLoading(true);
            setError(null);
            try {
              await createMyTeam(payload);
              await loadAuthed();
            } catch (e) {
              setError(e?.message ?? "Failed to create team");
              debugLog("createMyTeam error", e?.message ?? e);
            } finally {
              setLoading(false);
            }
          }}
        />
      )}

      {authed && !team && error ? (
        <div className="text-sm text-red-700">{error}</div>
      ) : null}
    </div>
  );
}


