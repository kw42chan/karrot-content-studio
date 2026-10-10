import { describe, expect, it } from "vitest";
import { isDraftPlaceholderSlug, publicPostPath, validateSitePublishFields } from "./site-publish";

describe("site publish validation", () => {
  it("rejects draft placeholder slugs", () => {
    expect(isDraftPlaceholderSlug("draft-abc")).toBe(true);
    expect(validateSitePublishFields({
      slug: "draft-abc",
      seo_title: "Title",
      meta_description: "Meta",
      body: "Body",
    })).toContain("draft-");
  });

  it("accepts valid fields", () => {
    expect(
      validateSitePublishFields({
        slug: "my-post",
        seo_title: "SEO",
        meta_description: "Desc",
        body: "Hello",
      }),
    ).toBeNull();
    expect(publicPostPath("my-post")).toBe("/p/my-post");
  });
});
