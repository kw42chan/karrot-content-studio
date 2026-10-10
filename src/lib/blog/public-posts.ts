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
  if (/^\d{10,}$/.test(t)) return true;
  if (TEST_TITLE_OR_SLUG.test(t)) return true;
  return false;
}

/** Title shown in the studio posts list and editor chrome — post title, not SEO title. */
export function studioListTitle(post: {
  title: string;
  slug: string;
  seo_title?: string | null;
}): string {
  if (looksLikeInternalTitle(post.title.trim())) return "Untitled draft";
  return publicArticleHeadline({ title: post.title, slug: post.slug });
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

/** Visible article headline on /p — post title only; SEO title is for metadata. */
export function publicArticleHeadline(post: { title: string; slug: string }): string {
  const title = post.title.trim();
  if (title && !looksLikeInternalTitle(title)) return title;
  return humanizeSlug(post.slug) || "Post";
}

/** Document title and Open Graph — SEO title when set, else post headline. */
export function publicMetadataTitle(post: {
  title: string;
  slug: string;
  seo_title?: string | null;
}): string {
  const seo = post.seo_title?.trim();
  if (seo && !looksLikeInternalTitle(seo)) return seo;
  return publicArticleHeadline(post);
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
const CJK_COVER_MAX = 10;

const CJK_RUN = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;

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
  return words[0];
}

function leadingCjkRun(display: string): string | null {
  const trimmed = display.trim();
  let run = "";
  for (const ch of trimmed) {
    if (CJK_RUN.test(ch)) run += ch;
    else break;
  }
  return run.length >= 2 ? run : null;
}

function firstCjkRun(display: string): string | null {
  const m = display.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]+/);
  return m && m[0].length >= 2 ? m[0] : null;
}

function leadingLatinWord(display: string): string | null {
  const m = display.trim().match(/^([A-Za-z][A-Za-z0-9]*)/);
  return m ? m[1] : null;
}

/** Latin-first mixed titles (e.g. Claude帳號…): keep leading Latin plus following CJK when it fits. */
function latinFirstMixedCover(display: string): string | null {
  const trimmed = display.trim();
  const latin = leadingLatinWord(trimmed);
  if (!latin || !trimmed.startsWith(latin)) return null;

  let cjk = "";
  for (const ch of trimmed.slice(latin.length)) {
    if (CJK_RUN.test(ch)) cjk += ch;
    else break;
  }

  let out = latin;
  if (cjk.length >= 2) out = latin + cjk;

  const maxLen = cjk.length >= 2 ? CJK_COVER_MAX : COVER_WORD_MAX;
  if (out.length <= maxLen) return out;
  if (cjk.length >= 2) {
    const room = maxLen - latin.length;
    return room > 0 ? latin + cjk.slice(0, room) : latin.slice(0, maxLen);
  }
  return latin.slice(0, maxLen);
}

export function coverWordForPost(post: PublicBlogPost): string {
  const display = publicArticleHeadline(post);
  if (/harness/i.test(display) && /engineering/i.test(display)) {
    return "Harness\nEngineering";
  }

  const cjkLead = leadingCjkRun(display);
  if (cjkLead) {
    return cjkLead.length <= CJK_COVER_MAX ? cjkLead : cjkLead.slice(0, CJK_COVER_MAX);
  }

  if (post.body_language === "zh-HK") {
    const mixed = latinFirstMixedCover(display);
    if (mixed) return mixed;
    const seg = firstCjkRun(display);
    if (seg) {
      return seg.length <= CJK_COVER_MAX ? seg : seg.slice(0, CJK_COVER_MAX);
    }
  }

  const latin = leadingLatinWord(display);
  if (latin && latin.length >= 4) {
    return latin.length <= COVER_WORD_MAX ? latin : latin.slice(0, COVER_WORD_MAX);
  }

  return fitCoverWords(display, COVER_WORD_MAX);
}
