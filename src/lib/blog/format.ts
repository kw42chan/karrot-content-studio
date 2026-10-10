export function formatPostDate(iso: string | null | undefined, locale = "en-US"): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });
}

export function formatPostDateUpper(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d
    .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    .toUpperCase();
}

export function readTimeLabel(minutes: number | null | undefined): string {
  const m = minutes && minutes > 0 ? minutes : 1;
  return `${m} min read`;
}

import { publicDisplayTitle } from "@/lib/blog/public-posts";

export function postDisplayTitle(entry: {
  seo_title?: string | null;
  title: string;
  slug?: string;
}): string {
  if (entry.slug) {
    return publicDisplayTitle({
      title: entry.title,
      slug: entry.slug,
      seo_title: entry.seo_title,
    });
  }
  return (entry.seo_title?.trim() || entry.title).trim();
}

export function postCardExcerpt(post: {
  excerpt?: string | null;
  meta_description?: string | null;
  my_take?: string | null;
}): string {
  return (
    post.excerpt?.trim() ||
    post.meta_description?.trim() ||
    post.my_take?.trim() ||
    ""
  );
}

export function stripSourcesSection(body: string): string {
  return body.replace(/\n## Sources[\s\S]*$/m, "").trim();
}
