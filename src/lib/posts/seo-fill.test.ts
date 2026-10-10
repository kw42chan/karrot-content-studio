import { describe, expect, it } from "vitest";
import { isPlaceholderSlug } from "./seo-slug";
import {
  buildFillSeoPersistPayload,
  deriveSlugWhenModelOmits,
  mergeSeoFillFromAi,
  regenerateSeoFillTargets,
  resolveFillSeoSlug,
  seoFillTargets,
  validateSeoFill,
} from "./seo-fill";

describe("seo-fill", () => {
  it("regenerate targets always refresh SEO title and meta; slug is optional", () => {
    expect(regenerateSeoFillTargets(true)).toEqual({
      slug: true,
      seoTitle: true,
      metaDescription: true,
    });
    expect(regenerateSeoFillTargets(false)).toEqual({
      slug: false,
      seoTitle: true,
      metaDescription: true,
    });
  });

  it("does not treat junk client slug as “already set” for placeholder-only heuristics", () => {
    const targets = seoFillTargets({
      slug: "ai-79f7b9",
      seoTitle: "AI 代理放工後繼續工作",
      metaDescription: "已有 meta",
      slugManuallyEdited: false,
    });
    expect(targets.slug).toBe(false);
    expect(targets.seoTitle).toBe(false);
    expect(targets.metaDescription).toBe(false);
  });

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

  it("prefers renamed English post title over body-derived AI slug", () => {
    expect(
      resolveFillSeoSlug({
        postTitle: "QA fillseo renamed",
        aiSlug: "ai-agent-after-hours",
        seoTitle: "AI 代理放工後繼續工作",
      }),
    ).toBe("qa-fillseo-renamed");
  });

  it("persists editor title and body in the same write as SEO fields", () => {
    const payload = buildFillSeoPersistPayload(
      {
        title: "QA fillseo renamed",
        body: "## Intro\n\nCantonese body paragraph.",
        myTake: "My angle",
        body_language: "zh-HK",
        status: "draft",
      },
      {
        slug: "qa-fillseo-renamed",
        seoTitle: "AI 代理放工後繼續工作",
        metaDescription: "Meta in Chinese.",
      },
    );
    expect(payload.title).toBe("QA fillseo renamed");
    expect(payload.body).toContain("Cantonese body");
    expect(payload.slug).toBe("qa-fillseo-renamed");
    expect(payload.seo_title).toBe("AI 代理放工後繼續工作");
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

    const withSlug = mergeSeoFillFromAi(
      snapshot,
      targets,
      {
        seoTitle: "AI 代理放工後繼續工作",
        metaDescription: "關於 AI 在夜間持續運作的簡介。",
        slug: "ai-agents-work-after-hours",
      },
      "",
      { postTitle: "Untitled draft" },
    );
    expect(withSlug.slug).toBe("ai-agents-work-after-hours");
    expect(validateSeoFill(targets, withSlug)).toBeNull();
  });
});
