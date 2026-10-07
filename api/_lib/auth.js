const crypto = require("crypto");

function secret() {
  if (!process.env.BODE_SESSION_SECRET) {
    throw new Error("BODE_SESSION_SECRET is not configured");
  }
  return process.env.BODE_SESSION_SECRET;
}

function sign(v) {
  return crypto.createHmac("sha256", secret()).update(v).digest("hex");
}

function makeSession(userId = "temp") {
  const v = Date.now().toString() + "." + userId;
  return v + "." + sign(v);
}

function validSession(req) {
  const c = req.headers.cookie || "";
  const m = c.match(/(?:^|; )bode_session=([^;]+)/);
  if (!m) return false;

  const parts = decodeURIComponent(m[1]).split(".");
  if (parts.length < 3) return false;

  const [timestamp, userId, signature] = parts;
  const payload = timestamp + "." + userId;

  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(sign(payload))
    );
    const notExpired = Date.now() - Number(timestamp) < 1000 * 60 * 60 * 24 * 30;
    return isValid && notExpired ? { userId, valid: true } : false;
  } catch {
    return false;
  }
}

function setSession(res, userId = "temp") {
  res.setHeader(
    "Set-Cookie",
    `bode_session=${encodeURIComponent(makeSession(userId))}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`
  );
}

module.exports = { validSession, setSession };
