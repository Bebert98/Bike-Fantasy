import express from "express";
import { adminMiddleware } from "../auth.js";

const router = express.Router();

// Minimal placeholders: the ingestion is run by cron (GitHub Actions) and writes to DB directly.
// These endpoints are here for future remote-triggering (optional).

router.post("/sync/daily", adminMiddleware, async (_req, res) => {
  return res.status(501).json({ error: "Not implemented. Run the Python ingest worker." });
});

router.post("/sync/season/:year", adminMiddleware, async (_req, res) => {
  return res.status(501).json({ error: "Not implemented. Run the Python ingest worker." });
});

export default router;


