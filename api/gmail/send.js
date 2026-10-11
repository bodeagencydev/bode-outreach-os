const crypto = require("crypto");
const { requireSupabaseUser } = require("../_lib/auth");

function decryptToken(value) {
  const key = Buffer.from(process.env.BODE_ENCRYPTION_KEY || "", "hex");
  if (key.length !== 32) throw new Error("BODE_ENCRYPTION_KEY is not configured correctly");
  const buffer = Buffer.from(value, "base64url");
  const iv = buffer.subarray(0, 12);
  const tag = buffer.subarray(12, 28);
  const encrypted = buffer.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

async function getAccessToken(refreshToken) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    })
  });
  const data = await response.json();
  return response.ok ? data : null;
}

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const user = await requireSupabaseUser(req, res);
  if (!user) return;

  try {
    const { account_id, to, subject, body } = req.body || {};
    const recipient = String(to || "").trim();
    const cleanSubject = String(subject || "").replace(/[\r\n]+/g, " ").trim();
    const messageBody = String(body || "").trim();
    if (!account_id || !recipient || !cleanSubject || !messageBody) {
      return res.status(400).json({ error: "Account, recipient, subject, and message are required." });
    }
    if (recipient.length > 254 || !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(recipient)) {
      return res.status(400).json({ error: "Enter a valid recipient email address." });
    }
    if (cleanSubject.length > 240 || messageBody.length > 20000) {
      return res.status(400).json({ error: "Subject or message is too long." });
    }

    const base = process.env.SUPABASE_URL.replace(/\/$/, "");
    const accountUrl = base + "/rest/v1/gmail_accounts?id=eq." + encodeURIComponent(account_id) +
      "&user_id=eq." + encodeURIComponent(user.id) + "&select=id,email,refresh_token,enabled";
    const accountResponse = await fetch(accountUrl, {
      headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + process.env.SUPABASE_SERVICE_ROLE_KEY }
    });
    if (!accountResponse.ok) return res.status(502).json({ error: "Could not verify the selected Gmail account." });
    const rows = await accountResponse.json();
    const account = rows[0];
    if (!account || !account.enabled) return res.status(404).json({ error: "That Gmail account is not available in your workspace." });

    const token = await getAccessToken(decryptToken(account.refresh_token));
    if (!token?.access_token) return res.status(502).json({ error: "Could not refresh Gmail access. Reconnect the Gmail account." });

    const raw = [
      "From: " + account.email,
      "To: " + recipient,
      "Subject: " + (/[^\x20-\x7E]/.test(cleanSubject) ? "=?UTF-8?B?" + Buffer.from(cleanSubject, "utf8").toString("base64") + "?=" : cleanSubject),
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: 8bit",
      "",
      messageBody
    ].join("\r\n");

    const gmailResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { Authorization: "Bearer " + token.access_token, "Content-Type": "application/json" },
      body: JSON.stringify({ raw: base64url(raw) })
    });
    const data = await gmailResponse.json();
    if (!gmailResponse.ok) {
      const status = gmailResponse.status === 429 || (gmailResponse.status === 403 && /rate|quota|limit/i.test(data.error?.message || ""))
        ? 429 : gmailResponse.status;
      return res.status(status).json({
        error: status === 429 ? "Google reported a sending or quota restriction. The queue must pause." : "Gmail could not send this message.",
        providerMessage: String(data.error?.message || "").slice(0, 180)
      });
    }

    await fetch(base + "/rest/v1/gmail_accounts?id=eq." + encodeURIComponent(account.id) +
      "&user_id=eq." + encodeURIComponent(user.id), {
      method: "PATCH",
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: "Bearer " + process.env.SUPABASE_SERVICE_ROLE_KEY,
        "content-type": "application/json"
      },
      body: JSON.stringify({ last_used_at: new Date().toISOString() })
    });

    return res.status(200).json({ ok: true, messageId: data.id, threadId: data.threadId, account: account.email });
  } catch (error) {
    return res.status(500).json({ error: "Could not send the Gmail message.", details: String(error.message || "").slice(0, 160) });
  }
};
