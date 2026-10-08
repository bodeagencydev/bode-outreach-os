const { requireSupabaseUser } = require("../_lib/auth");

module.exports = async (req, res) => {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const user = await requireSupabaseUser(req, res);
  if (!user) return;

  try {
    const url = process.env.SUPABASE_URL.replace(/\\/$/, "") +
      "/rest/v1/gmail_accounts?select=id,email,enabled,created_at,last_used_at&user_id=eq." +
      encodeURIComponent(user.id) + "&order=created_at.asc";
    const response = await fetch(url, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: "Bearer " + process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    });
    if (!response.ok) return res.status(502).json({ error: "Could not load your connected Gmail accounts." });
    return res.status(200).json(await response.json());
  } catch {
    return res.status(503).json({ error: "Account service is temporarily unavailable." });
  }
};
