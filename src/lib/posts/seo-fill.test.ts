import { describe, expect, it } from "vitest";
import { isPlaceholderSlug } from "./seo-slug";
import {
  deriveSlugWhenModelOmits,
  mergeSeoFillFromAi,
  seoFillTargets,
  validateSeoFill,
} from "./seo-fill";

describe("seo-fill", () => {
  it("treats null seo_title and draft slug as needing fill even when post title exists", () => {
    const targets = seoFillTargets({
      slug: "draft-1791617546123",
      seoTitle: "",
      metaDescription: "",
      slugManuallyEdited: false,
    });
    expect(targets.slug).toBe(true);
    expect(targets.seoTitle).toBe(true);
    expect(targets.metaDescription).toBe(true);
  });

  it("derives ASCII slug when model omits slug and SEO title is Chinese", () => {
    const slug = deriveSlugWhenModelOmits(
      "AI 代理放工後繼續工作",
      "關於自動化與夜間工作的摘要。",
      "",
      "ai-agents-work-after-hours",
    );
    expect(slug).toBe("ai-agents-work-after-hours");
  });

  it("merges AI fields for all targets and validates together", () => {
    const snapshot = {
      slug: "draft-1791617546123",
      seoTitle: "",
      metaDescription: "",
      slugManuallyEdited: false,
    };
    const targets = seoFillTargets(snapshot);
    const filled = mergeSeoFillFromAi(
      snapshot,
      targets,
      {
        seoTitle: "AI 代理放工後繼續工作",
        metaDescription: "關於 AI 在夜間持續運作的簡介。",
        slug: "",
      },
      "Body-derived meta for testing.",
    );
    expect(filled.seoTitle).toBe("AI 代理放工後繼續工作");
    expect(filled.metaDescription).toContain("Body-derived");
    expect(isPlaceholderSlug(filled.slug)).toBe(true);
    expect(validateSeoFill(targets, filled)).toMatch(/URL slug/);

    const withSlug = mergeSeoFillFromAi(snapshot, targets, {
      seoTitle: "AI 代理放工後繼續工作",
      metaDescription: "關於 AI 在夜間持續運作的簡介。",
      slug: "ai-agents-work-after-hours",
    }, "");
    expect(withSlug.slug).toBe("ai-agents-work-after-hours");
    expect(validateSeoFill(targets, withSlug)).toBeNull();
  });
});
