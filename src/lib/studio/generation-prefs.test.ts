import { describe, expect, it } from "vitest";
import { DEFAULT_GENERATION_PREFS, normalizeGenerationPrefs } from "./generation-prefs";

describe("normalizeGenerationPrefs", () => {
  it("fills defaults for empty input", () => {
    expect(normalizeGenerationPrefs({})).toEqual(DEFAULT_GENERATION_PREFS);
  });

  it("merges partial blog prefs", () => {
    const p = normalizeGenerationPrefs({ blog: { length: "indepth" } });
    expect(p.blog.length).toBe("indepth");
    expect(p.blog.coverage).toBe("summarize");
  });
});
