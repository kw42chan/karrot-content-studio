import { describe, expect, it } from "vitest";
import {
  coverWordForPost,
  filterPublicPosts,
  isTestOrInternalPost,
  isUsableCoverUrl,
  pickFeaturedPost,
  publicArticleHeadline,
  publicDisplayTitle,
  studioListTitle,
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

describe("studioListTitle", () => {
  it("uses post title in studio, not seo_title", () => {
    expect(
      studioListTitle({
        title: "如何安全註冊並使用官方Claude Opus 5.5？",
        slug: "claude-opus-register",
        seo_title: "中國護照註冊Claude帳號可行嗎？",
      }),
    ).toBe("如何安全註冊並使用官方Claude Opus 5.5？");
  });

  it("shows Untitled draft for timestamp internal titles", () => {
    expect(
      studioListTitle({
        title: "1791607702533",
        slug: "draft-1791607702533",
        seo_title: null,
      }),
    ).toBe("Untitled draft");
  });
});

describe("publicArticleHeadline", () => {
  it("uses post title for H1 even when seo_title differs", () => {
    expect(
      publicArticleHeadline({
        title: "QA fillseo renamed",
        slug: "qa-fillseo-renamed",
      }),
    ).toBe("QA fillseo renamed");
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
  it("uses the newest visible published post for Latest post", () => {
    const guide = post({
      id: "1",
      title: "Claude guide",
      slug: "claude-guide",
      key_points: [{ title: "One" }],
      published_at: "2026-10-07T00:00:00Z",
      category: "account-security",
      seo_title: "Claude guide",
    });
    const newer = post({
      id: "2",
      title: "Newer article",
      slug: "newer-article",
      published_at: "2026-10-08T00:00:00Z",
      seo_title: "Newer article",
    });
    expect(pickFeaturedPost([guide, newer])?.slug).toBe("newer-article");
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

describe("isUsableCoverUrl", () => {
  it("accepts https URLs and rejects empty or non-http schemes", () => {
    expect(isUsableCoverUrl("https://cdn.example.com/cover.jpg")).toBe(true);
    expect(isUsableCoverUrl("  ")).toBe(false);
    expect(isUsableCoverUrl("not-a-url")).toBe(false);
    expect(isUsableCoverUrl("javascript:alert(1)")).toBe(false);
    expect(isUsableCoverUrl("data:image/png;base64,abc")).toBe(false);
  });
});

describe("coverWordForPost", () => {
  it("uses whole words for English titles without mid-word chop", () => {
    const word = coverWordForPost(
      post({
        id: "1",
        title: "QA r4 test",
        slug: "qa-r4-test",
        seo_title: "QA r4 test",
        body_language: "en",
      }),
    );
    expect(word).toBe("QA r4");
  });

  it("prefers leading CJK for mixed titles", () => {
    expect(
      coverWordForPost(
        post({
          id: "1",
          title: "中國護照註冊Claude",
          slug: "china-passport",
          seo_title: "中國護照註冊Claude",
          body_language: "zh-HK",
        }),
      ),
    ).toBe("中國護照註冊");
  });

  it("keeps leading Latin plus following CJK when Latin leads on zh posts", () => {
    expect(
      coverWordForPost(
        post({
          id: "1",
          title: "Claude帳號安全",
          slug: "claude-safety",
          seo_title: "Claude帳號安全",
          body_language: "zh-HK",
        }),
      ),
    ).toBe("Claude帳號安全");
  });

  it("keeps leading Latin on long Claude zh post titles", () => {
    expect(
      coverWordForPost(
        post({
          id: "1",
          title: "Claude帳號安全設定指南：穩定使用必備技巧",
          slug: "claude-account-safety",
          seo_title: "中國護照註冊Claude",
          body_language: "zh-HK",
        }),
      ),
    ).toBe("Claude帳號安全");
  });

  it("keeps spaced Latin words without mid-word chop", () => {
    expect(
      coverWordForPost(
        post({
          id: "1",
          title: "QA r6 test A",
          slug: "qa-r6",
          seo_title: "QA r6 test A",
          body_language: "en",
        }),
      ),
    ).toBe("QA r6");
  });

  it("keeps full short CJK title on cover when it fits", () => {
    const word = coverWordForPost(
      post({
        id: "1",
        title: "測試文章第五輪",
        slug: "test-round-5",
        seo_title: "測試文章第五輪",
        body_language: "zh-HK",
      }),
    );
    expect(word).toBe("測試文章第五輪");
  });

  it("uses post title for cover text, not seo_title", () => {
    const word = coverWordForPost(
      post({
        id: "1",
        title: "如何安全註冊並使用官方Claude",
        slug: "use-chinese-passport-register-claude",
        seo_title: "中國護照註冊Claude帳號可行嗎？",
        body_language: "zh-HK",
      }),
    );
    expect(word.startsWith("如何")).toBe(true);
    expect(word).not.toContain("中國護照註冊");
  });

  it("falls back to humanized slug when post title is internal", () => {
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
    expect(word).toMatch(/Claude/i);
  });
});
