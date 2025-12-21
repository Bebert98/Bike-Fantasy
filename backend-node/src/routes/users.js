import express from "express";
import { z } from "zod";
import { supabase } from "../supabase.js";
import { authMiddleware } from "../auth.js";

const router = express.Router();

router.get("/me", authMiddleware, async (req, res) => {
    const { data: user, error } = await supabase
        .from("users")
        .select("id, display_name, profile_image_url")
        .eq("id", req.userId)
        .maybeSingle();

    if (error) return res.status(500).json({ error: "DB error" });
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({
        id: user.id,
        displayName: user.display_name,
        profileImageUrl: user.profile_image_url ?? null,
    });
});

router.patch("/me", authMiddleware, async (req, res) => {
    const schema = z
        .object({
            displayName: z.string().min(2).max(80).optional(),
            profileImageUrl: z.string().url().nullable().optional(),
        })
        .strict();

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request" });

    const patch = {};
    if (parsed.data.displayName !== undefined) patch.display_name = parsed.data.displayName;
    if (parsed.data.profileImageUrl !== undefined)
        patch.profile_image_url = parsed.data.profileImageUrl;

    const { data: user, error } = await supabase
        .from("users")
        .update(patch)
        .eq("id", req.userId)
        .select("id, display_name, profile_image_url")
        .maybeSingle();

    if (error) return res.status(500).json({ error: "DB error" });
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({
        id: user.id,
        displayName: user.display_name,
        profileImageUrl: user.profile_image_url ?? null,
    });
});

export default router;


