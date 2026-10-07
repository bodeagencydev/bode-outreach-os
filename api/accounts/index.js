const { validSession } = require("../_lib/auth");

module.exports = async (req, res) => {
  const session = validSession(req);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const r = await fetch(
      process.env.SUPABASE_URL +
        "/rest/v1/gmail_accounts?select=id,email,enabled,created_at,last_used_at&order=created_at.asc",
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: "Bearer " + process.env.SUPABASE_SERVICE_ROLE_KEY,
        },
      }
    );

    if (!r.ok) {
      return res.status(500).json({ error: await r.text() });
    }

    const data = await r.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
