const dns = require("dns").promises;
const net = require("net");
const { requireSupabaseUser } = require("./_lib/auth");

function isPublicAddress(ip) {
  if (net.isIPv4(ip)) {
    const p = ip.split(".").map(Number);
    return !(p[0] === 10 || p[0] === 127 || p[0] === 0 ||
      (p[0] === 169 && p[1] === 254) ||
      (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
      (p[0] === 192 && p[1] === 168) ||
      (p[0] >= 224) || (p[0] === 100 && p[1] >= 64 && p[1] <= 127));
  }
  if (net.isIPv6(ip)) {
    const x = ip.toLowerCase();
    return x === "::1" ? false :
      !(x === "::" || x.startsWith("fc") || x.startsWith("fd") ||
        /^fe[89ab]/.test(x) || x.startsWith("ff") ||
        x.startsWith("::ffff:127.") || x.startsWith("::ffff:10.") ||
        x.startsWith("::ffff:192.168.") || x.startsWith("::ffff:169.254."));
  }
  return false;
}

async function validatePublicUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error("Enter a valid website URL."); }
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only public HTTP or HTTPS websites are supported.");
  if (url.username || url.password) throw new Error("Website URLs cannot contain login credentials.");
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || net.isIP(host)) {
    throw new Error("Use a public website domain, not a local or raw IP address.");
  }
  const records = await dns.lookup(host, { all: true, verbatim: true });
  if (!records.length || records.some(record => !isPublicAddress(record.address))) {
    throw new Error("This website does not resolve to a publicly accessible address.");
  }
  return url;
}

function decodeEntities(value) {
  return value.replace(/&commat;|&#64;|&#x40;/gi, "@")
    .replace(/&period;|&#46;|&#x2e;/gi, ".")
    .replace(/&nbsp;/gi, " ");
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const user = await requireSupabaseUser(req, res);
  if (!user) return;

  try {
    let current = await validatePublicUrl(String(req.body?.url || "").trim());
    let response;
    for (let redirects = 0; redirects <= 3; redirects++) {
      response = await fetch(current.href, {
        redirect: "manual",
        signal: AbortSignal.timeout(8000),
        headers: { "User-Agent": "OutreachOS-ContactFinder/1.0", "Accept": "text/html, text/plain;q=0.8" }
      });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        if (redirects === 3) return res.status(422).json({ error: "The website redirected too many times." });
        const location = response.headers.get("location");
        if (!location) return res.status(422).json({ error: "The website returned an invalid redirect." });
        current = await validatePublicUrl(new URL(location, current).href);
        continue;
      }
      break;
    }
    if (!response?.ok) return res.status(422).json({ error: "The website could not be read. It may block automated requests.", status: response?.status });
    const type = (response.headers.get("content-type") || "").toLowerCase();
    if (!(type.includes("text/html") || type.includes("text/plain") || type.includes("application/xhtml"))) {
      return res.status(415).json({ error: "That URL did not return a readable web page." });
    }
    const length = Number(response.headers.get("content-length") || 0);
    if (length > 1500000) return res.status(413).json({ error: "This page is too large to scan." });
    const html = decodeEntities((await response.text()).slice(0, 1500000));
    const found = new Set();
    for (const match of html.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)) {
      const email = match[0].replace(/[),.;:'"<>]+$/g, "").toLowerCase();
      if (email.length <= 254 && !/\.(png|jpe?g|gif|svg|webp|css|js)$/i.test(email)) found.add(email);
      if (found.size >= 200) break;
    }
    const emails = [...found];
    return res.status(200).json({
      ok: true,
      url: current.origin,
      emails,
      scannedAt: new Date().toISOString(),
      note: emails.length ? "" : "No email addresses were visible in the page HTML. Try the Contact or About page URL."
    });
  } catch (error) {
    const message = String(error?.message || "");
    const timedOut = /timeout|aborted/i.test(message);
    return res.status(timedOut ? 504 : 422).json({
      error: timedOut ? "The website took too long to respond." : (message.slice(0, 180) || "Could not scan that website.")
    });
  }
};
