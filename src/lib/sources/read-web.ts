import {
  BROWSER_UA,
  extractOgFallback,
  extractReadableArticle,
} from "./extract-web-text";
import type { SourceReadResult } from "./types";

export async function readWebSource(url: string): Promise<SourceReadResult> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": BROWSER_UA,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9,zh-HK;q=0.8",
    },
    redirect: "follow",
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new Error(`Web fetch failed: ${res.status}`);
  }
  const html = await res.text();
  const finalUrl = res.url || url;

  const extracted = extractReadableArticle(html, finalUrl);
  if (extracted && extracted.text.length > 0) {
    return {
      title: extracted.title,
      author: extracted.author,
      text: extracted.text,
      published_at: null,
      url: finalUrl,
      full_text: extracted.full_text,
    };
  }

  const og = extractOgFallback(html);
  if (!og.text.trim()) {
    throw new Error("Could not extract readable article text");
  }

  return {
    title: og.title,
    author: null,
    text: og.text.trim(),
    published_at: null,
    url: finalUrl,
    full_text: og.full_text,
  };
}
