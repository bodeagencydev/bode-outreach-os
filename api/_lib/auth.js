const crypto = require("crypto");

function secret() {
  const value = process.env.BODE_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("BODE_SESSION_SECRET must be configured with at least 32 characters");
  return value;
}

function sign(value) {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function cookieValue(req, name) {
  const cookies = req.headers.cookie || "";
  const match = cookies.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : "";
}

// Legacy workspace sessions remain available for backwards compatibility only.
// Multi-user API routes must use requireSupabaseUser instead.
function makeSession(userId = "temp") {
  const value = Date.now().toString() + "." + userId;
  return value + "." + sign(value);
}

function validSession(req) {
  const value = cookieValue(req, "bode_session");
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  const [timestamp, userId, signature] = parts;
  const payload = timestamp + "." + userId;
  const age = Date.now() - Number(timestamp);
  if (!Number.isFinite(age) || age < 0 || age > 1000 * 60 * 60 * 24 * 30) return false;
  return safeEqual(signature, sign(payload)) ? { userId, valid: true } : false;
}

function setSession(res, userId = "temp") {
  res.setHeader("Set-Cookie", "bode_session=" + encodeURIComponent(makeSession(userId)) + "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000");
}

async function getSupabaseUser(req) {
  const auth = req.headers.authorization || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase server configuration is incomplete");
  }
  const response = await fetch(process.env.SUPABASE_URL.replace(/\/$/, "") + "/auth/v1/user", {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: "Bearer " + match[1]
    }
  });
  if (!response.ok) return null;
  const user = await response.json();
  return user && user.id ? user : null;
}

async function requireSupabaseUser(req, res) {
  try {
    const user = await getSupabaseUser(req);
    if (!user) {
      res.status(401).json({ error: "Sign in to your Bode Outreach OS account first." });
      return null;
    }
    return user;
  } catch (error) {
    res.status(503).json({ error: "Authentication service is temporarily unavailable." });
    return null;
  }
}

function createOAuthState(userId, nonce) {
  const payload = Buffer.from(JSON.stringify({
    userId,
    nonce,
    issuedAt: Date.now()
  })).toString("base64url");
  return payload + "." + sign(payload);
}

function verifyOAuthState(state, cookieNonce) {
  if (!state || !cookieNonce) return null;
  const parts = String(state).split(".");
  if (parts.length !== 2 || !safeEqual(parts[1], sign(parts[0]))) return null;
  try {
    const data = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    const age = Date.now() - Number(data.issuedAt);
    if (!data.userId || !data.nonce || !safeEqual(data.nonce, cookieNonce)) return null;
    if (!Number.isFinite(age) || age < 0 || age > 10 * 60 * 1000) return null;
    return data;
  } catch {
    return null;
  }
}

module.exports = {
  validSession,
  setSession,
  requireSupabaseUser,
  createOAuthState,
  verifyOAuthState,
  cookieValue
};
