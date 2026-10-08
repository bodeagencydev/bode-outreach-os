module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    return res.status(503).json({
      error: "Supabase browser configuration is incomplete. Set SUPABASE_ANON_KEY or SUPABASE_PUBLISHABLE_KEY in Vercel."
    });
  }
  return res.status(200).json({ supabaseUrl: url, supabaseAnonKey: key });
};
