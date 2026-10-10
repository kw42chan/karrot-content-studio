import { describe, expect, it } from "vitest";
import { normalizeVariantResult } from "./normalize-variant-result";

describe("normalizeVariantResult", () => {
  it("reads content from alternate keys", () => {
    const r = normalizeVariantResult("x", { paragraph: "Hello tweet" });
    expect(r.content).toBe("Hello tweet");
  });
});
