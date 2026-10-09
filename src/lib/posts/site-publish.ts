export function isDraftPlaceholderSlug(slug: string): boolean {
  return slug.trim().toLowerCase().startsWith("draft-");
}

export function validateSitePublishFields(input: {
  slug: string;
  seo_title: string | null | undefined;
  meta_description: string | null | undefined;
  body: string;
}): string | null {
  const slug = input.slug.trim();
  if (!slug) return "Publish failed: add a URL slug in Blog settings.";
  if (isDraftPlaceholderSlug(slug)) {
    return "Publish failed: choose a real slug (not a draft- placeholder).";
  }

  const seoTitle = (input.seo_title ?? "").trim();
  if (!seoTitle) {
    return "Publish failed: SEO title is required in Blog settings.";
  }

  const meta = (input.meta_description ?? "").trim();
  if (!meta) {
    return "Publish failed: meta description is required in Blog settings.";
  }

  const body = input.body.replace(/\n## Sources[\s\S]*$/m, "").trim();
  if (!body) {
    return "Publish failed: post body is empty.";
  }

  return null;
}

export function publicPostPath(slug: string): string {
  return `/p/${slug.trim()}`;
}
