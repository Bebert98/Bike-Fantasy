import jwt from "jsonwebtoken";
import { env } from "./env.js";

export function signUserToken(userId) {
    return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: "180d" });
}

export function authMiddleware(req, res, next) {
    const hdr = req.headers.authorization;
    if (!hdr || !hdr.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing auth token" });
    }
    const token = hdr.slice("Bearer ".length).trim();
    try {
        const payload = jwt.verify(token, env.jwtSecret);
        req.userId = payload?.sub;
        if (!req.userId) return res.status(401).json({ error: "Invalid token" });
        return next();
    } catch {
        return res.status(401).json({ error: "Invalid token" });
    }
}

export function adminMiddleware(req, res, next) {
    if (!env.adminKey) return res.status(403).json({ error: "Admin disabled" });
    const key = req.header("x-admin-key");
    if (!key || key !== env.adminKey) return res.status(403).json({ error: "Forbidden" });
    return next();
}


