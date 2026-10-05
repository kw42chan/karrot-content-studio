import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import type { SourceReadResult } from "./types";

export async function readWebSource(url: string): Promise<SourceReadResult> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; KarrotContentStudio/1.0; +https://karrotdigital.com)",
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new Error(`Web fetch failed: ${res.status}`);
  }
  const html = await res.text();
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article?.textContent?.trim()) {
    throw new Error("Could not extract readable article text");
  }

  return {
    title: article.title ?? null,
    author: article.byline ?? null,
    text: article.textContent.trim(),
    published_at: null,
    url,
    full_text: true,
  };
}
