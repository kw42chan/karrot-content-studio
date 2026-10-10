import { describe, expect, it } from "vitest";
import { serverAuthRedirectBaseUrl } from "./site-url";

describe("serverAuthRedirectBaseUrl", () => {
  it("uses request origin on vercel preview", () => {
    expect(
      serverAuthRedirectBaseUrl("https://karrot-content-studio-abc.vercel.app/auth/callback"),
    ).toBe("https://karrot-content-studio-abc.vercel.app");
  });
});
