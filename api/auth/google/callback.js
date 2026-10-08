const crypto = require("crypto");
const { cookieValue, verifyOAuthState } = require("../../_lib/auth");

async function json(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.error || "Google OAuth request failed");
  return data;
}

function encryptToken(value) {
  const key = Buffer.from(process.env.BODE_ENCRYPTION_KEY || "", "hex");
  if (key.length !== 32) throw new Error("BODE_ENCRYPTION_KEY must be a 64-character hex key");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  try {
    if (req.query.error) {
      res.setHeader("Set-Cookie", "bode_oauth_nonce=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
      return res.redirect("/?gmail_error=" + encodeURIComponent(String(req.query.error)));
    }

    const state = verifyOAuthState(req.query.state, cookieValue(req, "bode_oauth_nonce"));
    res.setHeader("Set-Cookie", "bode_oauth_nonce=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
    if (!state) return res.status(400).send("Google connection expired or could not be verified. Return to the app and try again.");
    if (!req.query.code) return res.status(400).send("Google did not return an authorization code.");

    const tokens = await json("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: req.query.code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code"
      })
    });

    const profile = await json("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: "Bearer " + tokens.access_token }
    });
    if (!profile.email) throw new Error("Google did not return an email address.");

    const base = process.env.SUPABASE_URL.replace(/\\/$/, "") + "/rest/v1/gmail_accounts";
    const headers = {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: "Bearer " + process.env.SUPABASE_SERVICE_ROLE_KEY,
      "content-type": "application/json"
    };
    const query = "?select=id,refresh_token&user_id=eq." + encodeURIComponent(state.userId) +
      "&email=eq." + encodeURIComponent(profile.email);
    const existingResponse = await fetch(base + query, { headers });
    if (!existingResponse.ok) throw new Error("Could not verify the Gmail account record.");
    const existingRows = await existingResponse.json();
    const existing = existingRows[0];

    const refreshToken = tokens.refresh_token
      ? encryptToken(tokens.refresh_token)
      : existing && existing.refresh_token;
    if (!refreshToken) {
      throw new Error("Google did not provide a refresh token. Remove this app from your Google Account permissions and connect again.");
    }

    const payload = {
      user_id: state.userId,
      email: profile.email,
      refresh_token: refreshToken,
      enabled: true
    };

    let saveResponse;
    if (existing) {
      saveResponse = await fetch(base + "?id=eq." + encodeURIComponent(existing.id) +
        "&user_id=eq." + encodeURIComponent(state.userId), {
        method: "PATCH",
        headers,
        body: JSON.stringify({ refresh_token: refreshToken, enabled: true })
      });
    } else {
      saveResponse = await fetch(base, {
        method: "POST",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify(payload)
      });
    }
    if (!saveResponse.ok) {
      throw new Error("Could not save the Gmail account. Confirm the gmail_accounts table has a user_id column.");
    }

    return res.redirect("/?gmail_connected=" + encodeURIComponent(profile.email));
  } catch (error) {
    return res.status(500).send("Google connection failed. Return to the app and try again. Details: " + String(error.message || "Unknown error").slice(0, 180));
  }
};
