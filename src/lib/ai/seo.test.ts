import { describe, expect, it } from "vitest";
import { parseSeoDraft } from "./seo";

describe("parseSeoDraft", () => {
  it("reads plain-text sections and clamps length", () => {
    const out = parseSeoDraft(
      [
        "===SEO_TITLE===",
        "A".repeat(80),
        "===META_DESCRIPTION===",
        "B".repeat(200),
        "===SLUG===",
        "Claude Safety Guide!",
        "===END===",
      ].join("\n"),
    );
    expect(out.seoTitle.length).toBe(60);
    expect(out.metaDescription.length).toBe(160);
    expect(out.slug).toBe("claude-safety-guide");
  });
});
