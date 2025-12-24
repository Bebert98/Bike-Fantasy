import express from "express";
import cors from "cors";
import morgan from "morgan";

import { env } from "./env.js";

import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import teamsRoutes from "./routes/teams.js";
import publicTeamsRoutes from "./routes/publicTeams.js";
import ridersRoutes from "./routes/riders.js";
import leaderboardRoutes from "./routes/leaderboard.js";
import historyRoutes from "./routes/history.js";
import racesRoutes from "./routes/races.js";
import adminRoutes from "./routes/admin.js";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/users", teamsRoutes); // /me/team under /api/users
app.use("/api/teams", publicTeamsRoutes);
app.use("/api/riders", ridersRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/races", racesRoutes);
app.use("/api/admin", adminRoutes);

app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Megabike API listening on :${env.port}`);
});


