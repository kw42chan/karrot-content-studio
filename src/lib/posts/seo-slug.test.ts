import { describe, expect, it } from "vitest";
import {
  isPlaceholderMeta,
  isPlaceholderSeoTitle,
  isPlaceholderSlug,
  publishBlockReason,
  seoSlug,
  withSlugSuffix,
} from "./seo-slug";

describe("seoSlug", () => {
  it("lowercases, hyphenates, and caps at 60 characters", () => {
    expect(seoSlug("Claude Account Safety Guide!")).toBe("claude-account-safety-guide");
    expect(seoSlug("  多個   Words  ")).toBe("words");
    const long = seoSlug("word ".repeat(30));
    expect(long.length).toBeLessThanOrEqual(60);
    expect(long.endsWith("-")).toBe(false);
  });
});

describe("withSlugSuffix", () => {
  it("appends a short suffix without passing 60 characters", () => {
    const out = withSlugSuffix("a".repeat(80), "ab12");
    expect(out.endsWith("-ab12")).toBe(true);
    expect(out.length).toBeLessThanOrEqual(60);
  });
});

describe("placeholders", () => {
  it("treats draft slugs, Untitled draft, and empty meta as unedited", () => {
    expect(isPlaceholderSlug("draft-1791446437576")).toBe(true);
    expect(isPlaceholderSlug("claude-safety")).toBe(false);
    expect(isPlaceholderSeoTitle("Untitled draft")).toBe(true);
    expect(isPlaceholderSeoTitle("")).toBe(true);
    expect(isPlaceholderSeoTitle("Claude 封號")).toBe(false);
    expect(isPlaceholderMeta("")).toBe(true);
    expect(isPlaceholderMeta("A summary.")).toBe(false);
  });
});

describe("publishBlockReason", () => {
  it("blocks placeholder SEO and allows a finished set", () => {
    expect(publishBlockReason("draft-123", "Untitled draft", "")).toMatch(/Fill SEO/);
    expect(
      publishBlockReason("claude-safety", "Keep Claude stable", "A short description."),
    ).toBeNull();
  });
});
