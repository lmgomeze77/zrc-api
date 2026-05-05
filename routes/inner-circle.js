// routes/inner-circle.js
// ZRC API - Inner Circle membership gate
// POST /api/inner-circle/check  - check if email is an approved member
// POST /api/inner-circle/apply  - submit a membership request

const express = require("express");
const router  = express.Router();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // service role for inserts

function sbHeaders(serviceRole = false) {
  const key = serviceRole && SUPABASE_SERVICE_KEY ? SUPABASE_SERVICE_KEY : SUPABASE_KEY;
  return {
    "Content-Type": "application/json",
    apikey: key,
    Authorization: `Bearer ${key}`,
  };
}

// ── CHECK membership status ───────────────────────────────────
// POST /api/inner-circle/check  { email }
// Returns: { approved: true/false, status: "approved"|"pending"|"none" }

router.post("/check", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Valid email required" });
    }

    const clean = email.toLowerCase().trim();
    const url = `${SUPABASE_URL}/rest/v1/inner_circle_members?email=eq.${encodeURIComponent(clean)}&select=status&limit=1`;

    const resp = await fetch(url, { headers: sbHeaders() });
    const data = await resp.json();

    if (!Array.isArray(data) || data.length === 0) {
      return res.json({ approved: false, status: "none" });
    }

    const member = data[0];
    return res.json({
      approved: member.status === "approved",
      status: member.status,
    });

  } catch (err) {
    console.error("Inner Circle check error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── APPLY for membership ──────────────────────────────────────
// POST /api/inner-circle/apply  { email, name }
// Inserts with status="pending" if not already in table

router.post("/apply", async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Valid email required" });
    }

    const clean = email.toLowerCase().trim();

    // Check if already exists
    const checkUrl = `${SUPABASE_URL}/rest/v1/inner_circle_members?email=eq.${encodeURIComponent(clean)}&select=status&limit=1`;
    const checkResp = await fetch(checkUrl, { headers: sbHeaders() });
    const existing  = await checkResp.json();

    if (Array.isArray(existing) && existing.length > 0) {
      return res.json({ ok: true, status: existing[0].status, existing: true });
    }

    // Insert new pending application
    const insertResp = await fetch(`${SUPABASE_URL}/rest/v1/inner_circle_members`, {
      method: "POST",
      headers: { ...sbHeaders(true), Prefer: "return=minimal" },
      body: JSON.stringify({
        email: clean,
        name: (name || "").trim() || null,
        status: "pending",
      }),
    });

    if (!insertResp.ok) {
      const err = await insertResp.text();
      console.error("Supabase insert error:", err);
      return res.status(500).json({ error: "Could not save application" });
    }

    res.json({ ok: true, status: "pending", existing: false });

  } catch (err) {
    console.error("Inner Circle apply error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
