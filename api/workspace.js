const { requireSupabaseUser } = require("./_lib/auth");

const TABLE_URL = () => process.env.SUPABASE_URL.replace(/\\/$/, "") + "/rest/v1/workspace_state";
const serverHeaders = () => ({
  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: "Bearer " + process.env.SUPABASE_SERVICE_ROLE_KEY,
  "content-type": "application/json"
});

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const user = await requireSupabaseUser(req, res);
  if (!user) return;

  if (req.method === "GET") {
    try {
      const url = TABLE_URL() + "?user_id=eq." + encodeURIComponent(user.id) + "&select=data,updated_at";
      const response = await fetch(url, { headers: serverHeaders() });
      if (!response.ok) return res.status(502).json({ error: "Could not load your saved workspace." });
      const rows = await response.json();
      return res.status(200).json({ data: rows[0]?.data ?? null, updatedAt: rows[0]?.updated_at ?? null });
    } catch {
      return res.status(503).json({ error: "Workspace storage is temporarily unavailable." });
    }
  }

  if (req.method !== "PUT" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST, PUT");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const data = req.body?.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return res.status(400).json({ error: "A workspace data object is required." });
  }
  const payload = {
    leads: Array.isArray(data.leads) ? data.leads : [],
    subjects: Array.isArray(data.subjects) ? data.subjects : [],
    messages: Array.isArray(data.messages) ? data.messages : [],
    campaigns: Array.isArray(data.campaigns) ? data.campaigns : [],
    accounts: Array.isArray(data.accounts) ? data.accounts : [],
    settings: data.settings && typeof data.settings === "object" && !Array.isArray(data.settings) ? data.settings : {}
  };
  if (Buffer.byteLength(JSON.stringify(payload), "utf8") > 900000) {
    return res.status(413).json({ error: "Workspace is too large to save in one request." });
  }

  try {
    const response = await fetch(TABLE_URL() + "?on_conflict=user_id", {
      method: "POST",
      headers: { ...serverHeaders(), Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ user_id: user.id, data: payload, updated_at: new Date().toISOString() })
    });
    if (!response.ok) return res.status(502).json({ error: "Could not save your workspace. Confirm the workspace_state SQL migration has been applied." });
    return res.status(200).json({ ok: true, updatedAt: new Date().toISOString() });
  } catch {
    return res.status(503).json({ error: "Workspace storage is temporarily unavailable." });
  }
};
