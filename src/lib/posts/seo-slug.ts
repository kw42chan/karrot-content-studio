/** URL slug: lowercase, hyphenated, ASCII, at most 60 characters. */
export function seoSlug(raw: string): string {
  const base = raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return base;
}

/** Keep the result within 60 chars after a uniqueness suffix. */
export function withSlugSuffix(slug: string, suffix: string): string {
  const extra = `-${suffix.replace(/[^a-z0-9]/gi, "").toLowerCase()}`;
  const room = Math.max(1, 60 - extra.length);
  const base = (slug || "post").slice(0, room).replace(/-+$/g, "");
  return `${base || "post"}${extra}`;
}

export function isPlaceholderSlug(slug: string): boolean {
  return slug.trim().toLowerCase().startsWith("draft-");
}

export function isPlaceholderSeoTitle(title: string): boolean {
  const t = title.trim();
  return t === "" || t === "Untitled draft";
}

export function isPlaceholderMeta(meta: string): boolean {
  return meta.trim() === "";
}

/** SEO title for publish when the field was never edited away from the new-post default. */
export function effectiveSeoTitle(seoTitle: string, postTitle: string): string {
  const seo = seoTitle.trim();
  if (!isPlaceholderSeoTitle(seo)) return seo;
  const title = postTitle.trim();
  if (title && !isPlaceholderSeoTitle(title)) return title;
  return seo;
}

export function publishBlockReason(
  slug: string,
  seoTitle: string,
  meta: string,
  options?: { postTitle?: string },
): string | null {
  const resolvedSeo = options?.postTitle
    ? effectiveSeoTitle(seoTitle, options.postTitle)
    : seoTitle.trim();
  if (isPlaceholderSlug(slug) || isPlaceholderSeoTitle(resolvedSeo) || isPlaceholderMeta(meta)) {
    return "Fill SEO first — set a real slug, SEO title, and meta description before publishing.";
  }
  return null;
}
