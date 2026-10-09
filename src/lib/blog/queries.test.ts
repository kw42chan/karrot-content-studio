import { describe, expect, it } from "vitest";
import { buildMoreInCategory } from "./queries";
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

describe("buildMoreInCategory", () => {
  it("returns 3 cards topping up with previous posts from other categories", () => {
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
    const related = buildMoreInCategory([current, harness], current, true, 3);
    expect(related).toHaveLength(3);
    expect(related.some((c) => c.kind === "post" && c.post.slug === "harness-engineering" && c.previous)).toBe(
      true,
    );
  });
});
