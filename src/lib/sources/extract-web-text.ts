import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export function extractMeta(html: string, key: string, attr = "property"): string | null {
  const re1 = new RegExp(
    `<meta[^>]+${attr}=["']${key}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const m1 = html.match(re1);
  if (m1) return decodeHtmlEntities(m1[1]);
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${key}["']`,
    "i",
  );
  const m2 = html.match(re2);
  return m2 ? decodeHtmlEntities(m2[1]) : null;
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function extractReadableArticle(html: string, url: string): {
  title: string | null;
  author: string | null;
  text: string;
  full_text: boolean;
} | null {
  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;

  const reader = new Readability(doc);
  const article = reader.parse();

  if (article?.content) {
    const inner = new JSDOM(article.content);
    const text = inner.window.document.body.textContent?.replace(/\s+/g, " ").trim() ?? "";
    if (text.length > 200) {
      return {
        title: article.title ?? extractMeta(html, "og:title") ?? doc.title ?? null,
        author: article.byline ?? null,
        text: normalizeParagraphs(text),
        full_text: true,
      };
    }
  }

  if (article?.textContent?.trim() && article.textContent.trim().length > 200) {
    return {
      title: article.title ?? null,
      author: article.byline ?? null,
      text: normalizeParagraphs(article.textContent.trim()),
      full_text: true,
    };
  }

  return null;
}

export function extractOgFallback(html: string): {
  title: string | null;
  text: string;
  full_text: boolean;
} {
  const title = extractMeta(html, "og:title") ?? extractMeta(html, "twitter:title", "name");
  const description =
    extractMeta(html, "og:description") ??
    extractMeta(html, "description", "name") ??
    extractMeta(html, "twitter:description", "name") ??
    "";

  return {
    title,
    text: description,
    full_text: false,
  };
}

function normalizeParagraphs(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .join("\n\n");
}

export { BROWSER_UA };
