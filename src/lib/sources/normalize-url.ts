export function normalizeSourceUrl(raw: string): string {
  let url = raw.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  const parsed = new URL(url);
  parsed.hash = "";
  if (parsed.hostname === "twitter.com" || parsed.hostname === "www.twitter.com") {
    parsed.hostname = "x.com";
  }
  if (parsed.hostname === "www.threads.com") {
    parsed.hostname = "threads.net";
  }
  if (parsed.pathname.endsWith("/") && parsed.pathname.length > 1) {
    parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  }
  parsed.search = "";
  return parsed.toString();
}

export function detectPlatform(url: string): "x" | "threads" | "web" {
  const u = new URL(url);
  const host = u.hostname.replace(/^www\./, "");
  if (host === "x.com" || host === "twitter.com") return "x";
  if (host === "threads.net" || host === "threads.com") return "threads";
  return "web";
}

export function parseXStatus(url: string): { user: string; id: string } | null {
  const m = url.match(/(?:x\.com|twitter\.com)\/([^/]+)\/status\/(\d+)/i);
  if (!m) return null;
  return { user: m[1], id: m[2] };
}
