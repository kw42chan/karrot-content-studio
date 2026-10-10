import { deriveMetaDescription } from "@/lib/posts/publish-prep";
import {
  isPlaceholderMeta,
  isPlaceholderSeoTitle,
  isPlaceholderSlug,
  seoSlug,
} from "@/lib/posts/seo-slug";

export type SeoFillSnapshot = {
  slug: string;
  seoTitle: string;
  metaDescription: string;
  slugManuallyEdited: boolean;
};

export type SeoFillTargets = {
  slug: boolean;
  seoTitle: boolean;
  metaDescription: boolean;
};

export function seoFillTargets(snapshot: SeoFillSnapshot): SeoFillTargets {
  return {
    slug: isPlaceholderSlug(snapshot.slug) && !snapshot.slugManuallyEdited,
    seoTitle: isPlaceholderSeoTitle(snapshot.seoTitle),
    metaDescription: isPlaceholderMeta(snapshot.metaDescription),
  };
}

export type PreparedSeoFill = {
  slug: string;
  seoTitle: string;
  metaDescription: string;
};

function containsCjk(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text);
}

/** Derive ASCII slug when the model omitted SLUG (e.g. Chinese SEO title only). */
export function deriveSlugWhenModelOmits(
  seoTitle: string,
  metaDescription: string,
  modelSlug: string,
  englishSlugHint?: string,
): string {
  const fromModel = seoSlug(modelSlug);
  if (fromModel.length >= 2) return fromModel;
  const fromHint = seoSlug(englishSlugHint ?? "");
  if (fromHint.length >= 2) return fromHint;
  if (!containsCjk(seoTitle)) {
    const fromTitle = seoSlug(seoTitle);
    if (fromTitle.length >= 2) return fromTitle;
  }
  if (!containsCjk(metaDescription)) {
    const fromMeta = seoSlug(metaDescription);
    if (fromMeta.length >= 2) return fromMeta;
  }
  return "";
}

export function mergeSeoFillFromAi(
  snapshot: SeoFillSnapshot,
  targets: SeoFillTargets,
  ai: { seoTitle: string; metaDescription: string; slug: string },
  derivedMeta: string,
): PreparedSeoFill {
  let slug = snapshot.slug;
  let seoTitle = snapshot.seoTitle;
  let metaDescription = snapshot.metaDescription;

  if (targets.seoTitle) {
    seoTitle = ai.seoTitle.trim();
  }
  if (targets.metaDescription) {
    const fromBody = derivedMeta.trim();
    metaDescription =
      fromBody && !isPlaceholderMeta(fromBody) ? fromBody : ai.metaDescription.trim();
  }
  if (targets.slug) {
    const derived = deriveSlugWhenModelOmits(seoTitle, "", ai.slug, ai.slug);
    slug = derived || snapshot.slug;
  }

  return { slug, seoTitle, metaDescription };
}

export function validateSeoFill(
  targets: SeoFillTargets,
  filled: PreparedSeoFill,
): string | null {
  const missing: string[] = [];
  if (targets.slug && isPlaceholderSlug(filled.slug)) missing.push("URL slug");
  if (targets.seoTitle && isPlaceholderSeoTitle(filled.seoTitle)) missing.push("SEO title");
  if (targets.metaDescription && isPlaceholderMeta(filled.metaDescription)) {
    missing.push("meta description");
  }
  if (!missing.length) return null;
  if (missing.length === 1) {
    return `Fill SEO could not set ${missing[0]}. Try again or edit the field manually.`;
  }
  return `Fill SEO could not set: ${missing.join(", ")}. Try again or edit manually.`;
}

export function deriveMetaForFill(input: {
  myTake: string;
  body: string;
}): string {
  return deriveMetaDescription({
    metaDescription: "",
    myTake: input.myTake,
    body: input.body,
  });
}
