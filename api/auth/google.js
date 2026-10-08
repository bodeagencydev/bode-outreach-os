const crypto = require("crypto");
const { requireSupabaseUser, createOAuthState } = require("../_lib/auth");

module.exports = async (req, res) => {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const user = await requireSupabaseUser(req, res);
  if (!user) return;

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REDIRECT_URI || !process.env.BODE_SESSION_SECRET) {
    return res.status(503).json({ error: "Google OAuth is not configured on the server." });
  }

  const nonce = crypto.randomBytes(24).toString("base64url");
  const state = createOAuthState(user.id, nonce);
  res.setHeader("Set-Cookie", "bode_oauth_nonce=" + nonce + "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600");

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
    scope: [
      "openid",
      "email",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.modify"
    ].join(" ")
  });

  return res.status(200).json({ url: "https://accounts.google.com/o/oauth2/v2/auth?" + params.toString() });
};
