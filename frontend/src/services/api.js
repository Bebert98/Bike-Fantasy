import axios from "axios";
import { debugLog } from "./debug";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

const TOKEN_STORAGE_KEY = "megabike_token";
const MOCK_USER_KEY = "megabike_mock_user";
const MOCK_TEAM_KEY = "megabike_mock_team";
const OFFLINE_MODE = process.env.REACT_APP_OFFLINE === "true";

export function getAuthToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAuthToken(token) {
  if (!token) localStorage.removeItem(TOKEN_STORAGE_KEY);
  else localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

function isAxiosNetworkError(err) {
  // Axios sets err.response for HTTP responses (including 401/404).
  // No response typically means network down / backend not running.
  return !!err && typeof err === "object" && !!err.isAxiosError && !err.response;
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

async function get(path, config) {
  debugLog("GET", path, config?.params ?? null);
  try {
    const res = await api.get(path, config);
    debugLog("GET OK", path, res.status);
    return res.data;
  } catch (err) {
    debugLog("GET ERR", path, err?.message ?? err);
    throw err;
  }
}

async function post(path, body, config) {
  debugLog("POST", path, body ?? null);
  try {
    const res = await api.post(path, body, config);
    debugLog("POST OK", path, res.status);
    return res.data;
  } catch (err) {
    debugLog("POST ERR", path, err?.message ?? err);
    throw err;
  }
}

export async function autocompleteRiders(query) {
  try {
    return await get("/api/riders/autocomplete", { params: { query } });
  } catch (error) {
    debugLog("autocompleteRiders error", error?.message ?? error);
    return [];
  }
}

export async function verifyAccessCode(accessCode) {
  if (OFFLINE_MODE) {
    const token = `mock-${Date.now()}`;
    const user = {
      id: `mock_${String(accessCode || "user").replace(/\s+/g, "_")}`,
      displayName: String(accessCode || "Megabike User"),
      profileImageUrl: null,
    };
    writeJson(MOCK_USER_KEY, user);
    setAuthToken(token);
    return { token, user };
  }

  try {
    return await post("/api/auth/verify-code", { accessCode });
  } catch (err) {
    if (isAxiosNetworkError(err)) {
      // Backend not running yet: allow any code to pass so you can test the UI.
      const token = `mock-${Date.now()}`;
      const user = {
        id: `mock_${String(accessCode || "user").replace(/\s+/g, "_")}`,
        displayName: String(accessCode || "Megabike User"),
        profileImageUrl: null,
      };
      writeJson(MOCK_USER_KEY, user);
      setAuthToken(token);
      return { token, user };
    }
    throw err;
  }
}

export async function getHistory() {
  if (OFFLINE_MODE) {
    return { podium: [], mostTitles: [] };
  }
  try {
    return await get("/api/history");
  } catch (err) {
    if (isAxiosNetworkError(err)) return { podium: [], mostTitles: [] };
    throw err;
  }
}

export async function getLatestRace() {
  if (OFFLINE_MODE) {
    return {
      name: "Latest race (mock)",
      date: new Date().toISOString().slice(0, 10),
      results: [
        { rider: "Rider A", team: "Team 1", points: 120 },
        { rider: "Rider B", team: "Team 2", points: 95 },
        { rider: "Rider C", team: "Team 3", points: 80 },
      ],
    };
  }
  try {
    return await get("/api/races/latest");
  } catch (err) {
    if (isAxiosNetworkError(err)) {
      return {
        name: "Latest race (mock)",
        date: new Date().toISOString().slice(0, 10),
        results: [
          { rider: "Rider A", team: "Team 1", points: 120 },
          { rider: "Rider B", team: "Team 2", points: 95 },
          { rider: "Rider C", team: "Team 3", points: 80 },
        ],
      };
    }
    throw err;
  }
}

export async function getNextRace() {
  if (OFFLINE_MODE) {
    return {
      name: "Next race (mock)",
      date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    };
  }
  try {
    return await get("/api/races/next");
  } catch (err) {
    if (isAxiosNetworkError(err)) {
      return {
        name: "Next race (mock)",
        date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      };
    }
    throw err;
  }
}

export async function getMe() {
  if (OFFLINE_MODE) {
    const user = readJson(MOCK_USER_KEY, null);
    if (user) return user;
    return { id: "mock_user", displayName: "Megabike User", profileImageUrl: null };
  }
  try {
    return await get("/api/users/me");
  } catch (err) {
    if (isAxiosNetworkError(err)) {
      const user = readJson(MOCK_USER_KEY, null);
      if (user) return user;
      return { id: "mock_user", displayName: "Megabike User", profileImageUrl: null };
    }
    throw err;
  }
}

export async function updateMe(payload) {
  if (OFFLINE_MODE) {
    const user = readJson(MOCK_USER_KEY, {}) || {};
    if (payload.displayName) user.displayName = payload.displayName;
    if (payload.profileImageUrl !== undefined) user.profileImageUrl = payload.profileImageUrl;
    writeJson(MOCK_USER_KEY, user);
    return user;
  }
  try {
    return await api.patch("/api/users/me", payload);
  } catch (err) {
    if (isAxiosNetworkError(err)) {
      // Emulate offline
      const user = readJson(MOCK_USER_KEY, {}) || {};
      if (payload.displayName) user.displayName = payload.displayName;
      if (payload.profileImageUrl !== undefined) user.profileImageUrl = payload.profileImageUrl;
      writeJson(MOCK_USER_KEY, user);
      return user;
    }
    throw err;
  }
}

export async function getMyTeam() {
  if (OFFLINE_MODE) return readJson(MOCK_TEAM_KEY, null);
  try {
    return await get("/api/users/me/team");
  } catch (err) {
    if (isAxiosNetworkError(err)) return readJson(MOCK_TEAM_KEY, null);
    throw err;
  }
}

export async function createMyTeam(payload) {
  if (OFFLINE_MODE) {
    const existing = readJson(MOCK_TEAM_KEY, null);
    if (existing) throw new Error("Team already exists (locked).");

    const nowYear = new Date().getFullYear();
    const riders = (payload?.riders ?? []).map((r) => ({
      rider_name: r.rider_name,
      price: 0,
    }));
    const team = {
      teamName: payload?.teamName ?? "My Team",
      season: nowYear,
      riders,
      totalPrice: 0,
      points: 0,
      createdAt: new Date().toISOString(),
    };
    writeJson(MOCK_TEAM_KEY, team);
    return team;
  }

  try {
    return await post("/api/users/me/team", payload);
  } catch (err) {
    if (isAxiosNetworkError(err)) {
      const existing = readJson(MOCK_TEAM_KEY, null);
      if (existing) throw new Error("Team already exists (locked).");

      const nowYear = new Date().getFullYear();
      const riders = (payload?.riders ?? []).map((r) => ({
        rider_name: r.rider_name,
        price: 0,
      }));
      const team = {
        teamName: payload?.teamName ?? "My Team",
        season: nowYear,
        riders,
        totalPrice: 0,
        points: 0,
        createdAt: new Date().toISOString(),
      };
      writeJson(MOCK_TEAM_KEY, team);
      return team;
    }
    throw err;
  }
}

export async function getCurrentLeaderboard() {
  if (OFFLINE_MODE) {
    const team = readJson(MOCK_TEAM_KEY, null);
    const teams = team
      ? [{ id: "mock_team", teamName: team.teamName, points: team.points ?? 0 }]
      : [];
    return { teams };
  }
  try {
    return await get("/api/leaderboard/current");
  } catch (err) {
    if (isAxiosNetworkError(err)) {
      const team = readJson(MOCK_TEAM_KEY, null);
      const teams = team
        ? [{ id: "mock_team", teamName: team.teamName, points: team.points ?? 0 }]
        : [];
      return { teams };
    }
    throw err;
  }
}

export async function getTeamById(teamId, { season } = {}) {
  if (!teamId) throw new Error("Missing teamId");
  if (OFFLINE_MODE) {
    const team = readJson(MOCK_TEAM_KEY, null);
    if (!team) return null;
    return { ...team, id: teamId };
  }
  const params = season ? { season } : undefined;
  return await get(`/api/teams/${encodeURIComponent(teamId)}`, { params });
}