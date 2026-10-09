import { describe, expect, it } from "vitest";
import { friendlyCallbackError, friendlySignInError, isRateLimitError } from "./messages";

describe("friendlySignInError", () => {
  it("maps rate limit code", () => {
    expect(
      friendlySignInError({ code: "over_email_send_rate_limit", message: "x" }),
    ).toContain("Too many login emails");
  });

  it("maps invalid credentials", () => {
    expect(friendlySignInError({ code: "invalid_credentials", message: "Invalid login" })).toContain(
      "incorrect",
    );
  });

  it("maps redirect errors", () => {
    expect(
      friendlySignInError({ message: "Invalid email redirect URL" }),
    ).toContain("redirect");
  });
});

describe("isRateLimitError", () => {
  it("detects rate limit code", () => {
    expect(isRateLimitError({ code: "over_email_send_rate_limit" })).toBe(true);
  });
});

describe("friendlyCallbackError", () => {
  it("maps expired links", () => {
    expect(friendlyCallbackError("otp_expired", null)).toContain("expired");
  });

  it("maps disallowed accounts", () => {
    expect(friendlyCallbackError("not_allowed", "This account isn't allowed")).toContain(
      "isn't allowed",
    );
  });
});
