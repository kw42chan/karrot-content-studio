import { describe, expect, it, vi } from "vitest";
import * as llm from "@/lib/ai/llm-json";
import { generateSeoFields, parseSeoDraft } from "./seo";

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

describe("generateSeoFields", () => {
  it("infers an English slug when the model returns a Chinese title but no slug", async () => {
    vi.spyOn(llm, "completeText").mockImplementation(async ({ prompt }) => {
      if (prompt.includes("ONE URL slug")) {
        return { content: "ai-agents-work-after-hours" };
      }
      return {
        content: [
          "===SEO_TITLE===",
          "AI 代理放工後繼續工作",
          "===META_DESCRIPTION===",
          "關於 AI 在夜間持續運作的簡介。",
          "===SLUG===",
          "",
          "===END===",
        ].join("\n"),
      };
    });

    const out = await generateSeoFields({
      body: "Cantonese draft about AI agents working after hours.",
      language: "zh-HK",
    });
    expect(out.seoTitle).toBe("AI 代理放工後繼續工作");
    expect(out.slug).toBe("ai-agents-work-after-hours");
    vi.restoreAllMocks();
  });
});
