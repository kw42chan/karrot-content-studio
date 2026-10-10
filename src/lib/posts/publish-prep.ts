import { stripSourcesSection } from "@/lib/blog/format";
import {
  effectiveSeoTitle,
  isPlaceholderMeta,
  isPlaceholderSeoTitle,
  isPlaceholderSlug,
  seoSlug,
  withSlugSuffix,
} from "@/lib/posts/seo-slug";

const META_MAX = 155;

export type ResolvePublishInput = {
  title: string;
  slug: string;
  seoTitle: string;
  metaDescription: string;
  myTake: string;
  body: string;
  postId: string;
  status: "draft" | "published";
  slugManuallyEdited: boolean;
};

export type ResolvedPublishFields = {
  slug: string;
  seoTitle: string;
  metaDescription: string;
};

function clampMeta(text: string): string {
  const one = text.replace(/\s+/g, " ").trim();
  if (one.length <= META_MAX) return one;
  return `${one.slice(0, META_MAX - 1).trim()}…`;
}

function stripMarkdownForExcerpt(body: string): string {
  return body
    .replace(/^#+\s+/gm, "")
    .replace(/\*\*|__/g, "")
    .replace(/\[(.+?)\]\([^)]+\)/g, "$1")
    .replace(/`+/g, "")
    .replace(/\n+/g, " ")
    .trim();
}

/** Non-AI meta description for publish when the field is still empty. */
export function deriveMetaDescription(input: {
  metaDescription: string;
  myTake: string;
  body: string;
}): string {
  const existing = input.metaDescription.trim();
  if (existing) return clampMeta(existing);

  const myTake = input.myTake.trim();
  if (myTake) return clampMeta(myTake);

  const bodyText = stripMarkdownForExcerpt(stripSourcesSection(input.body));
  if (bodyText) return clampMeta(bodyText);

  return "";
}

function slugHashSuffix(title: string, postId: string): string {
  const compact = title.trim().slice(0, 48);
  let h = 0;
  for (let i = 0; i < compact.length; i++) {
    h = (Math.imul(31, h) + compact.charCodeAt(i)) | 0;
  }
  const idPart = postId.replace(/-/g, "").slice(0, 6).toLowerCase() || "000000";
  return `post-${Math.abs(h).toString(36).slice(0, 8)}-${idPart}`;
}

/** Deterministic slug from title while still on the auto `draft-*` placeholder. */
export function proposeSlugFromTitle(title: string, postId: string, seoTitle?: string): string {
  const fromTitle = seoSlug(title);
  if (fromTitle.length >= 2) {
    return withSlugSuffix(fromTitle, postId.replace(/-/g, "").slice(0, 6));
  }
  const fromSeo = seoSlug(effectiveSeoTitle(seoTitle ?? "", title));
  if (fromSeo.length >= 2) {
    return withSlugSuffix(fromSeo, postId.replace(/-/g, "").slice(0, 6));
  }
  return slugHashSuffix(title || "post", postId);
}

export function resolvePublishFields(input: ResolvePublishInput): ResolvedPublishFields {
  const seoTitle = effectiveSeoTitle(input.seoTitle, input.title);
  const metaDescription = deriveMetaDescription({
    metaDescription: input.metaDescription,
    myTake: input.myTake,
    body: input.body,
  });

  let slug = input.slug.trim();
  if (isPlaceholderSlug(slug) && !input.slugManuallyEdited) {
    slug = proposeSlugFromTitle(input.title, input.postId, seoTitle);
  }

  return { slug, seoTitle, metaDescription };
}

export function publishValidationMessage(
  fields: ResolvedPublishFields & { postTitle?: string },
): string | null {
  const seo = fields.postTitle
    ? effectiveSeoTitle(fields.seoTitle, fields.postTitle)
    : fields.seoTitle.trim();

  const missing: string[] = [];
  if (isPlaceholderSlug(fields.slug)) missing.push("URL slug");
  if (isPlaceholderSeoTitle(seo)) missing.push("SEO title");
  if (isPlaceholderMeta(fields.metaDescription)) missing.push("meta description");

  if (missing.length === 0) return null;
  if (missing.length === 1) {
    return `Add a ${missing[0]} before publishing (or add body / My take so meta can be filled automatically).`;
  }
  return `Before publishing, add: ${missing.join(", ")}.`;
}
