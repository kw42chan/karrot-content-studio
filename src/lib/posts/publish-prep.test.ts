import { describe, expect, it } from "vitest";
import { isPlaceholderSlug } from "./seo-slug";
import {
  deriveMetaDescription,
  proposeSlugFromTitle,
  publishValidationMessage,
  resolvePublishFields,
} from "./publish-prep";

describe("publish-prep", () => {
  it("proposes ASCII slug from English title", () => {
    const slug = proposeSlugFromTitle("My QA Post Title", "11111111-2222-3333-4444-555555555555");
    expect(slug).toMatch(/^my-qa-post-title/);
    expect(isPlaceholderSlug(slug)).toBe(false);
  });

  it("proposes hash-based slug for Chinese-only titles", () => {
    const slug = proposeSlugFromTitle("中國護照註冊", "11111111-2222-3333-4444-555555555555");
    expect(slug).toMatch(/^post-/);
    expect(isPlaceholderSlug(slug)).toBe(false);
  });

  it("derives meta from body without AI", () => {
    const meta = deriveMetaDescription({
      metaDescription: "",
      myTake: "",
      body: "## Intro\n\nThis is the first paragraph of the draft body for testing.",
    });
    expect(meta.length).toBeGreaterThan(10);
    expect(meta.length).toBeLessThanOrEqual(155);
  });

  it("resolves slug, seo, and meta for a renamed draft", () => {
    const resolved = resolvePublishFields({
      title: "PR5 publish test",
      slug: "draft-1791605666522",
      seoTitle: "PR5 publish test",
      metaDescription: "",
      myTake: "",
      body: "Body text long enough to become a meta description automatically.",
      postId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      status: "draft",
      slugManuallyEdited: false,
    });
    expect(isPlaceholderSlug(resolved.slug)).toBe(false);
    expect(resolved.seoTitle).toBe("PR5 publish test");
    expect(resolved.metaDescription.length).toBeGreaterThan(0);
    expect(publishValidationMessage(resolved)).toBeNull();
  });

  it("does not replace slug on published posts", () => {
    const resolved = resolvePublishFields({
      title: "New title",
      slug: "already-live-slug",
      seoTitle: "Already live",
      metaDescription: "Summary.",
      myTake: "",
      body: "",
      postId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      status: "published",
      slugManuallyEdited: false,
    });
    expect(resolved.slug).toBe("already-live-slug");
  });
});
