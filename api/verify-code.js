import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

// Vercel Serverless Function
export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { accessCode } = req.body;
    if (!accessCode) {
        return res.status(400).json({ error: "Access code is required" });
    }

    // 1. Init Supabase Service Client (Admin)
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
        console.error("Missing SUPABASE env vars in serverless function.");
        return res.status(500).json({ error: "Server configuration error" });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // 2. Verify Access Code
    const { data: codeRow, error: codeErr } = await supabase
        .from("access_codes")
        .select("id, code, is_active")
        .eq("code", accessCode.trim())
        .maybeSingle();

    if (codeErr) {
        console.error("DB Error (access_codes):", codeErr);
        return res.status(500).json({ error: "Database error" });
    }

    if (!codeRow || !codeRow.is_active) {
        return res.status(401).json({ error: "Invalid access code" });
    }

    // 3. Find or Create User
    const { data: existingUser, error: userLookupErr } = await supabase
        .from("users")
        .select("id, display_name, profile_image_url")
        .eq("access_code_id", codeRow.id)
        .maybeSingle();

    if (userLookupErr) {
        return res.status(500).json({ error: "Database error (user lookup)" });
    }

    let user = existingUser;
    if (!user) {
        const displayName = accessCode.trim();
        const { data: created, error: createErr } = await supabase
            .from("users")
            .insert({ access_code_id: codeRow.id, display_name: displayName })
            .select("id, display_name, profile_image_url")
            .single();

        if (createErr) {
            console.error("DB Error (user create):", createErr);
            return res.status(500).json({ error: "Failed to create user" });
        }
        user = created;
    }

    // 4. Sign JWT (Standard Supabase JWT)
    // Payload must contain: aud: 'authenticated', role: 'authenticated', sub: user.id
    // Signed with SUPABASE_JWT_SECRET (found in dashboard settings -> API)

    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (!jwtSecret) {
        console.error("Missing SUPABASE_JWT_SECRET");
        return res.status(500).json({ error: "Server configuration error" });
    }

    const payload = {
        aud: "authenticated",
        role: "authenticated",
        sub: user.id,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), // 1 week
        app_metadata: {
            provider: "megabike_access_code"
        },
        user_metadata: {
            access_code_id: codeRow.id
        }
    };

    const token = jwt.sign(payload, jwtSecret);

    // 5. Return Token & User
    return res.status(200).json({
        token,
        user: {
            id: user.id,
            displayName: user.display_name,
            profileImageUrl: user.profile_image_url ?? null,
        },
    });
}
