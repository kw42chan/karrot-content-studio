import { describe, expect, it } from "vitest";
import {
  coverWordForPost,
  filterPublicPosts,
  isTestOrInternalPost,
  pickFeaturedPost,
  publicDisplayTitle,
} from "./public-posts";
import type { PublicBlogPost } from "./types";

function post(partial: Partial<PublicBlogPost> & Pick<PublicBlogPost, "id" | "title" | "slug">): PublicBlogPost {
  return {
    seo_title: null,
    meta_description: null,
    excerpt: null,
    my_take: "",
    body: "",
    body_language: "en",
    published_at: "2026-10-08T00:00:00Z",
    category: null,
    read_time: 4,
    cover_url: null,
    key_points: null,
    ...partial,
  };
}

describe("isTestOrInternalPost", () => {
  it("flags retest-style titles", () => {
    expect(isTestOrInternalPost({ title: "Retest 3-5 persistence", slug: "claude-guide" })).toBe(true);
  });
});

describe("publicDisplayTitle", () => {
  it("prefers seo_title over internal title", () => {
    expect(
      publicDisplayTitle({
        title: "fdraft",
        slug: "claude-account-safety",
        seo_title: "Claude帳號安全設定指南",
      }),
    ).toBe("Claude帳號安全設定指南");
  });
});

describe("pickFeaturedPost", () => {
  it("prefers newest post with key_points over newer test post", () => {
    const guide = post({
      id: "1",
      title: "Claude guide",
      slug: "claude-guide",
      key_points: [{ title: "One" }],
      published_at: "2026-10-07T00:00:00Z",
      category: "account-security",
    });
    const test = post({
      id: "2",
      title: "Retest 3-5 persistence",
      slug: "retest",
      published_at: "2026-10-08T00:00:00Z",
    });
    expect(pickFeaturedPost([test, guide])?.slug).toBe("claude-guide");
  });
});

describe("filterPublicPosts", () => {
  it("removes test posts from the grid list", () => {
    const visible = filterPublicPosts([
      post({ id: "1", title: "Retest", slug: "retest-x" }),
      post({ id: "2", title: "Real", slug: "real-post", seo_title: "Real post" }),
    ]);
    expect(visible).toHaveLength(1);
    expect(visible[0].slug).toBe("real-post");
  });
});

describe("coverWordForPost", () => {
  it("does not use fdraft internal title for zh cover", () => {
    const word = coverWordForPost(
      post({
        id: "1",
        title: "fdraft",
        slug: "claude-account-safety",
        seo_title: "Claude帳號安全設定指南：穩定使用必備技巧",
        body_language: "zh-HK",
      }),
    );
    expect(word).not.toBe("fdraft");
    expect(word).toContain("Claude");
  });
});
