import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { postNewStudioPost } from "./use-new-post";

describe("postNewStudioPost", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs with same-origin credentials and no-store cache", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ id: "abc-123" }),
    } as Response);

    const id = await postNewStudioPost();
    expect(id).toBe("abc-123");
    expect(fetch).toHaveBeenCalledWith("/api/studio/new-post", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
    });
  });

  it("throws with server error message", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "Server error" }),
    } as Response);

    await expect(postNewStudioPost()).rejects.toThrow("Server error");
    errorSpy.mockRestore();
  });
});
