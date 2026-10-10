import { describe, expect, it, vi } from "vitest";
import {
  OpenRouterRequestError,
  userMessageForOpenRouterStatus,
} from "./openrouter-errors";

describe("openrouter-errors", () => {
  it("maps 404 to a readable model message", () => {
    expect(userMessageForOpenRouterStatus(404)).toMatch(/model/i);
    expect(userMessageForOpenRouterStatus(404)).not.toMatch(/user_id/);
  });

  it("does not expose provider JSON on the error surface", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const raw = JSON.stringify({ error: { message: "gone" }, user_id: "secret-user" });
    const err = new OpenRouterRequestError("chat", 404, raw);
    expect(err.message).not.toContain("secret-user");
    expect(err.message).not.toContain("gone");
    vi.mocked(console.error).mockRestore();
  });
});
