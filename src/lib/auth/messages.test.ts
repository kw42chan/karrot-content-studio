import { describe, expect, it } from "vitest";
import { friendlyCallbackError, friendlySignInError } from "./messages";

describe("friendlySignInError", () => {
  it("maps rate limit code", () => {
    expect(
      friendlySignInError({ code: "over_email_send_rate_limit", message: "x" }),
    ).toContain("Too many login emails");
  });

  it("maps redirect errors", () => {
    expect(
      friendlySignInError({ message: "Invalid email redirect URL" }),
    ).toContain("redirect");
  });
});

describe("friendlyCallbackError", () => {
  it("maps expired links", () => {
    expect(friendlyCallbackError("otp_expired", null)).toContain("expired");
  });
});
