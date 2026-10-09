import { describe, expect, it, vi } from "vitest";
import { STUDIO_POSTS_HOME, navigateToStudioPostsHome } from "./routes";

describe("studio routes", () => {
  it("uses /studio as posts list home", () => {
    expect(STUDIO_POSTS_HOME).toBe("/studio");
  });

  it("replace + refresh after delete from list", () => {
    const replace = vi.fn();
    const refresh = vi.fn();
    navigateToStudioPostsHome({ replace, refresh });
    expect(replace).toHaveBeenCalledWith("/studio");
    expect(refresh).toHaveBeenCalled();
  });
});
