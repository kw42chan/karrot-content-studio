import { describe, expect, it } from "vitest";
import { categoryLabel } from "./categories";

describe("categoryLabel", () => {
  it("maps known categories to UI labels", () => {
    expect(categoryLabel("account-security")).toBe("Account & security");
    expect(categoryLabel("ai-tools")).toBe("AI tools");
  });
});
