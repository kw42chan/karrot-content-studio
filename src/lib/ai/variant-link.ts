import { isPlaceholderSlug } from "@/lib/posts/seo-slug";
import { publicPostPath } from "@/lib/posts/site-publish";
import { getSiteUrl } from "@/lib/env";

const LINK_PLACEHOLDER =
  /\[(?:link|Link|LINK|url|URL)\]|\{(?:link|url)\}|<(?:link|url)>/gi;

export function publicPostUrlForSlug(slug: string | null | undefined): string | null {
  const s = slug?.trim();
  if (!s || isPlaceholderSlug(s)) return null;
  const base = getSiteUrl().replace(/\/$/, "");
  return `${base}${publicPostPath(s)}`;
}

export function replaceLinkPlaceholders(text: string, postUrl: string | null): string {
  if (!text.includes("[") && !text.includes("{") && !text.includes("<")) return text;
  if (!postUrl) {
    return text
      .replace(LINK_PLACEHOLDER, "")
      .replace(/\s{2,}/g, " ")
      .replace(/\s+([,.!?])/g, "$1")
      .trim();
  }
  return text.replace(LINK_PLACEHOLDER, postUrl);
}

export function applyPostLinkToVariant<T extends { content: string; extra?: { thread_parts?: string[] } }>(
  variant: T,
  postUrl: string | null,
): T {
  const content = replaceLinkPlaceholders(variant.content, postUrl);
  const parts = variant.extra?.thread_parts?.map((p) => replaceLinkPlaceholders(p, postUrl));
  return {
    ...variant,
    content,
    extra: parts ? { ...variant.extra, thread_parts: parts } : variant.extra,
  };
}
