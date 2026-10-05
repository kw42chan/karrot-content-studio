import type { SourceReadResult } from "./types";

const THREADS_UA =
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";

function extractMeta(html: string, property: string): string | null {
  const re = new RegExp(
    `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const m = html.match(re);
  if (m) return m[1];
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`,
    "i",
  );
  const m2 = html.match(re2);
  return m2 ? m2[1] : null;
}

export async function readThreadsSource(url: string): Promise<SourceReadResult> {
  const res = await fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": THREADS_UA },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new Error(`Threads fetch failed: ${res.status}`);
  }
  const html = await res.text();
  const title = extractMeta(html, "og:title");
  const description = extractMeta(html, "og:description") ?? "";

  return {
    title,
    author: null,
    text: description,
    published_at: null,
    url: res.url || url,
    full_text: false,
  };
}
