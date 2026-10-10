import { deriveMetaDescription, isPlaceholderPostTitle } from "@/lib/posts/publish-prep";
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

/** User clicked Fill SEO — always regenerate SEO title and meta; slug optional (e.g. published + cancel). */
export function regenerateSeoFillTargets(updateSlug: boolean): SeoFillTargets {
  return {
    slug: updateSlug,
    seoTitle: true,
    metaDescription: true,
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
/** Prefer a real post title for the URL slug; use AI/body slug only when title is empty or placeholder. */
export function resolveFillSeoSlug(params: {
  postTitle: string;
  aiSlug: string;
  seoTitle: string;
}): string {
  if (!isPlaceholderPostTitle(params.postTitle)) {
    const fromPostTitle = seoSlug(params.postTitle);
    if (fromPostTitle.length >= 2) return fromPostTitle;
  }
  const fromAi = seoSlug(params.aiSlug);
  if (fromAi.length >= 2) return fromAi;
  return deriveSlugWhenModelOmits(params.seoTitle, "", params.aiSlug);
}

export type FillSeoEditorPersist = {
  title: string;
  body: string;
  myTake: string;
  body_language: "zh-HK" | "en";
  status: "draft" | "published";
  key_point?: string;
  social_title?: string;
  social_captions?: { zh?: string; en?: string };
  category?: string | null;
};

/** Fields saved together with SEO so unsaved editor text is not lost on refresh. */
export function buildFillSeoPersistPayload(
  editor: FillSeoEditorPersist,
  seo: { slug: string; seoTitle: string; metaDescription: string },
): Record<string, unknown> {
  return {
    title: editor.title,
    body: editor.body,
    my_take: editor.myTake,
    body_language: editor.body_language,
    status: editor.status,
    slug: seo.slug,
    seo_title: seo.seoTitle,
    meta_description: seo.metaDescription,
    key_point: editor.key_point ?? null,
    social_title: editor.social_title ?? null,
    social_captions: editor.social_captions ?? null,
    category: editor.category ?? null,
  };
}

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
  options?: { preferAiMeta?: boolean; postTitle?: string },
): PreparedSeoFill {
  let slug = snapshot.slug;
  let seoTitle = snapshot.seoTitle;
  let metaDescription = snapshot.metaDescription;

  if (targets.seoTitle) {
    seoTitle = ai.seoTitle.trim();
  }
  if (targets.metaDescription) {
    if (options?.preferAiMeta) {
      metaDescription = ai.metaDescription.trim();
    } else {
      const fromBody = derivedMeta.trim();
      metaDescription =
        fromBody && !isPlaceholderMeta(fromBody) ? fromBody : ai.metaDescription.trim();
    }
  }
  if (targets.slug) {
    const derived = resolveFillSeoSlug({
      postTitle: options?.postTitle ?? "",
      aiSlug: ai.slug,
      seoTitle,
    });
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
