import express from "express";
import { z } from "zod";
import { supabase } from "../supabase.js";
import { signUserToken } from "../auth.js";

const router = express.Router();

router.post("/verify-code", async (req, res) => {
  const bodySchema = z.object({ accessCode: z.string().min(1) });
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });

  const accessCode = parsed.data.accessCode.trim();

  const { data: codeRow, error: codeErr } = await supabase
    .from("access_codes")
    .select("id, code, is_active")
    .eq("code", accessCode)
    .maybeSingle();

  if (codeErr) return res.status(500).json({ error: "DB error" });
  if (!codeRow || !codeRow.is_active) return res.status(401).json({ error: "Invalid code" });

  // Find existing user by access_code_id or create one.
  const { data: existingUser, error: userLookupErr } = await supabase
    .from("users")
    .select("id, display_name, profile_image_url")
    .eq("access_code_id", codeRow.id)
    .maybeSingle();

  if (userLookupErr) return res.status(500).json({ error: "DB error" });

  let user = existingUser;
  if (!user) {
    const displayName = accessCode;
    const { data: created, error: createErr } = await supabase
      .from("users")
      .insert({ access_code_id: codeRow.id, display_name: displayName })
      .select("id, display_name, profile_image_url")
      .single();

    if (createErr) return res.status(500).json({ error: "DB error" });
    user = created;
  }

  const token = signUserToken(user.id);
  return res.json({
    token,
    user: {
      id: user.id,
      displayName: user.display_name,
      profileImageUrl: user.profile_image_url ?? null,
    },
  });
});

export default router;


