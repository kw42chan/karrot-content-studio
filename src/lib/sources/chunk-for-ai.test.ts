import { describe, expect, it } from "vitest";
import { chunkText } from "./chunk-for-ai";

describe("chunkText", () => {
  it("returns single chunk for short text", () => {
    expect(chunkText("hello")).toEqual(["hello"]);
  });

  it("splits very long text", () => {
    const long = "a".repeat(25000);
    const chunks = chunkText(long, 10000);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join("").length).toBeGreaterThanOrEqual(25000);
  });
});
