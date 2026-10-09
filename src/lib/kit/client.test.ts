import { describe, expect, it } from "vitest";
import { publishToKit } from "./client";

describe("publishToKit", () => {
  it("returns a clear error when KIT_API_KEY is missing", async () => {
    const prev = process.env.KIT_API_KEY;
    delete process.env.KIT_API_KEY;

    const result = await publishToKit({
      subject: "Test",
      contentHtml: "<p>Hi</p>",
      mode: "web_and_email",
      confirmEmail: true,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("KIT_API_KEY missing");
    }

    process.env.KIT_API_KEY = prev;
  });
});
