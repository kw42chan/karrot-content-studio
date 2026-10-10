import { describe, expect, it } from "vitest";
import type { User } from "@supabase/supabase-js";
import { isAdminSession, sessionEmail } from "./session-email";

const ADMIN = "darwin.chankawing@gmail.com";

function fakeUser(overrides: Partial<User> & { email?: string }): User {
  return {
    id: "u1",
    aud: "authenticated",
    role: "authenticated",
    created_at: "",
    app_metadata: {},
    user_metadata: {},
    ...overrides,
  } as User;
}

describe("sessionEmail", () => {
  it("rejects spoofed user_metadata.email when user.email differs", () => {
    const user = fakeUser({
      email: "attacker@example.com",
      email_confirmed_at: "2026-01-01T00:00:00Z",
      user_metadata: { email: ADMIN },
    });
    expect(sessionEmail(user)).toBe("attacker@example.com");
    expect(isAdminSession(user, ADMIN)).toBe(false);
  });

  it("accepts admin email+password when email is confirmed", () => {
    const user = fakeUser({
      email: ADMIN,
      email_confirmed_at: "2026-01-01T00:00:00Z",
      identities: [{ provider: "email", id: "e1", identity_id: "e1", user_id: "u1" }],
    });
    expect(sessionEmail(user)).toBe(ADMIN);
    expect(isAdminSession(user, ADMIN)).toBe(true);
  });

  it("accepts admin when user.email matches and is verified via Google", () => {
    const user = fakeUser({
      email: ADMIN,
      identities: [{ provider: "google", id: "g1", identity_id: "g1", user_id: "u1" }],
    });
    expect(sessionEmail(user)).toBe(ADMIN);
    expect(isAdminSession(user, ADMIN)).toBe(true);
  });

  it("ignores user_metadata even if it matches admin", () => {
    const user = fakeUser({
      email: "other@gmail.com",
      user_metadata: { email: ADMIN },
      identities: [{ provider: "google", id: "g1", identity_id: "g1", user_id: "u1" }],
    });
    expect(isAdminSession(user, ADMIN)).toBe(false);
  });
});
