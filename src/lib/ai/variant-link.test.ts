import { describe, expect, it } from "vitest";
import { applyPostLinkToVariant, replaceLinkPlaceholders } from "./variant-link";

describe("replaceLinkPlaceholders", () => {
  it("substitutes the public URL when known", () => {
    const url = "https://example.com/p/my-post";
    expect(replaceLinkPlaceholders("Read more at [Link] today.", url)).toBe(
      `Read more at ${url} today.`,
    );
  });

  it("removes placeholders when URL is unknown", () => {
    expect(replaceLinkPlaceholders("Details: [Link]", null)).toBe("Details:");
  });
});

describe("applyPostLinkToVariant", () => {
  it("fixes thread parts too", () => {
    const out = applyPostLinkToVariant(
      { content: "a", extra: { thread_parts: ["see [Link]"] } },
      "https://example.com/p/x",
    );
    expect(out.extra?.thread_parts?.[0]).toBe("see https://example.com/p/x");
  });
});
