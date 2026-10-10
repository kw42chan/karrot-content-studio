import { describe, expect, it } from "vitest";
import { postDisplayTitle } from "./format";

describe("postDisplayTitle", () => {
  it("shows post title on cards, not seo_title", () => {
    expect(
      postDisplayTitle({
        title: "如何安全註冊並使用官方Claude Opus 5.5？",
        slug: "use-chinese-passport-register-claude",
        seo_title: "中國護照註冊Claude帳號可行嗎？",
      }),
    ).toBe("如何安全註冊並使用官方Claude Opus 5.5？");
  });
});
