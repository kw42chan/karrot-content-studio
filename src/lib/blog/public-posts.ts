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
  const sorted = sortNewest(visible);
  const withGuide = sorted.filter(hasKeyPoints);
  if (withGuide.length) return withGuide[0];
  const withCategory = sorted.filter((p) => p.category);
  if (withCategory.length) return withCategory[0];
  return sorted[0];
}

export function coverWordForPost(post: PublicBlogPost): string {
  const display = publicDisplayTitle(post);
  if (/harness/i.test(display) && /engineering/i.test(display)) {
    return "Harness\nEngineering";
  }
  if (post.body_language === "zh-HK") {
    const compact = display.replace(/\s/g, "");
    if (compact.length >= 4) return compact.slice(0, 6);
    return "帳號安全";
  }
  const words = display.split(/\s+/).filter(Boolean);
  return words.slice(0, 2).join(" ") || "Post";
}
