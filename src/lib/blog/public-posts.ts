import type { KeyPoint, PublicBlogPost } from "@/lib/blog/types";

function sortNewest(posts: PublicBlogPost[]): PublicBlogPost[] {
  return [...posts].sort((a, b) => {
    const ta = a.published_at ? Date.parse(a.published_at) : 0;
    const tb = b.published_at ? Date.parse(b.published_at) : 0;
    return tb - ta;
  });
}

/** QA / internal publishes that should not drive the public blog chrome. */
const TEST_TITLE_OR_SLUG = /retest|persistence|test\s*post|qa\s*test/i;

/**
 * "Harness Engineering" appears in the static mock as a real article card.
 * It is only rendered when a matching row exists in studio_posts (published).
 * Kit / external-only content is not invented here — seed via studio if needed.
 */

export function looksLikeInternalTitle(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (/^untitled draft$/i.test(t)) return true;
  if (/^draft[-\s]/i.test(t)) return true;
  if (/fdraft/i.test(t)) return true;
  if (TEST_TITLE_OR_SLUG.test(t)) return true;
  return false;
}

export function isTestOrInternalPost(post: {
  title: string;
  slug: string;
  seo_title?: string | null;
}): boolean {
  const slug = post.slug.trim().toLowerCase();
  const title = post.title.trim();
  if (TEST_TITLE_OR_SLUG.test(title) || TEST_TITLE_OR_SLUG.test(slug)) return true;
  if (/^draft-\d{10,}$/i.test(slug) && looksLikeInternalTitle(title)) return true;
  if (!post.seo_title?.trim() && looksLikeInternalTitle(title)) return true;
  return false;
}

export function humanizeSlug(slug: string): string {
  return slug
    .replace(/^draft-/, "")
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Title safe for public cards (never raw internal draft titles when avoidable). */
export function publicDisplayTitle(post: {
  title: string;
  slug: string;
  seo_title?: string | null;
}): string {
  const seo = post.seo_title?.trim();
  if (seo && !looksLikeInternalTitle(seo)) return seo;
  const title = post.title.trim();
  if (title && !looksLikeInternalTitle(title)) return title;
  if (seo) return seo;
  return humanizeSlug(post.slug) || "Post";
}

export function hasKeyPoints(post: PublicBlogPost): boolean {
  const kp = post.key_points as KeyPoint[] | null | undefined;
  return Array.isArray(kp) && kp.length > 0;
}

export function filterPublicPosts(posts: PublicBlogPost[]): PublicBlogPost[] {
  return posts.filter((p) => !isTestOrInternalPost(p));
}

export function pickFeaturedPost(posts: PublicBlogPost[]): PublicBlogPost | null {
  const visible = filterPublicPosts(posts);
  if (!visible.length) return null;
  return sortNewest(visible)[0];
}

/** True when cover_url is safe to attempt as a public card background (http/https only). */
export function isUsableCoverUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed.length > 2048) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

const COVER_WORD_MAX = 8;

function fitCoverWords(display: string, maxLen: number): string {
  const words = display.split(/\s+/).filter(Boolean);
  if (!words.length) return "Post";
  let out = words[0];
  for (let i = 1; i < words.length; i++) {
    const next = `${out} ${words[i]}`;
    if (next.length <= maxLen) out = next;
    else break;
  }
  if (out.length <= maxLen) return out;
  if (words[0].length <= maxLen) return words[0];
  return words[0].slice(0, maxLen);
}

export function coverWordForPost(post: PublicBlogPost): string {
  const display = publicDisplayTitle(post);
  if (/harness/i.test(display) && /engineering/i.test(display)) {
    return "Harness\nEngineering";
  }
  if (post.body_language === "zh-HK") {
    const compact = display.replace(/\s/g, "");
    const latinLead = compact.match(/^[A-Za-z]{4,}/);
    if (latinLead) return latinLead[0].slice(0, 10);
    if (compact.length <= 6) return compact || "帳號安全";
    return compact.slice(0, 6);
  }
  return fitCoverWords(display, COVER_WORD_MAX);
}
