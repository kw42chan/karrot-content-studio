import { describe, expect, it } from "vitest";
import { computeReadTimeMinutes } from "./read-time";

describe("computeReadTimeMinutes", () => {
  it("returns at least 1 minute", () => {
    expect(computeReadTimeMinutes("", "en")).toBe(1);
  });

  it("estimates ~4 min for a ~1230 CJK character article", () => {
    const body = "中".repeat(1230);
    expect(computeReadTimeMinutes(body, "zh-HK")).toBe(4);
  });

  it("strips sources section before counting", () => {
    const body = "word ".repeat(50) + "\n## Sources\n- link";
    expect(computeReadTimeMinutes(body, "en")).toBe(1);
  });
});
