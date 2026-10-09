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
