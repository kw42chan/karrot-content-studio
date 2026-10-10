import { describe, expect, it } from "vitest";
import { readXSource } from "./read-x";

const MAGIC =
  "https://x.com/MagicPower21M/status/2106653640588927234";

describe("readXSource", () => {
  it("fetches long-form article text from fxtwitter", async () => {
    const result = await readXSource(MAGIC);
    expect(result.full_text).toBe(true);
    expect(result.text.length).toBeGreaterThan(200);
    expect(result.author).toBeTruthy();
  }, 20000);
});
