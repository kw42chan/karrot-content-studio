import { describe, expect, it } from "vitest";
import { buildMoreInCategory, countByCategory } from "./queries";
import type { PublicBlogPost } from "./types";

function post(partial: Partial<PublicBlogPost> & Pick<PublicBlogPost, "id" | "title" | "slug">): PublicBlogPost {
  return {
    seo_title: partial.seo_title ?? partial.title,
    meta_description: null,
    excerpt: null,
    my_take: "",
    body: "",
    body_language: "en",
    published_at: "2026-04-23T00:00:00Z",
    category: "automation",
    read_time: 2,
    cover_url: null,
    key_points: null,
    ...partial,
  };
}

describe("countByCategory", () => {
  it("excludes featured post from All count to match the index grid", () => {
    const featured = post({ id: "f", title: "Featured", slug: "featured", category: "automation" });
    const other = post({ id: "o", title: "Other", slug: "other", category: "automation" });
    const counts = countByCategory([featured, other], "featured");
    expect(counts.all).toBe(1);
    expect(counts.automation).toBe(1);
  });
});

describe("buildMoreInCategory", () => {
  it("returns up to 3 real posts, topping up with previous posts from other categories", () => {
    const current = post({
      id: "c",
      title: "Claude guide",
      slug: "claude-guide",
      category: "account-security",
      published_at: "2026-10-08T00:00:00Z",
    });
    const harness = post({
      id: "h",
      title: "Harness Engineering",
      slug: "harness-engineering",
      category: "automation",
      published_at: "2026-04-23T00:00:00Z",
    });
    const aiTools = post({
      id: "a",
      title: "AI tools roundup",
      slug: "ai-tools-roundup",
      category: "ai-tools",
      published_at: "2026-03-01T00:00:00Z",
    });
    const caseStudy = post({
      id: "cs",
      title: "Retail case study",
      slug: "retail-case-study",
      category: "case-studies",
      published_at: "2026-02-01T00:00:00Z",
    });
    const related = buildMoreInCategory([current, harness, aiTools, caseStudy], current, 3);
    expect(related).toHaveLength(3);
    expect(related.every((c) => c.kind === "post")).toBe(true);
    expect(related.some((c) => c.post.slug === "harness-engineering" && c.previous)).toBe(true);
    expect(related.some((c) => c.post.slug === "claude-guide")).toBe(false);
  });
});
