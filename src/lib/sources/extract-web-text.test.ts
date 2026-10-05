import { describe, expect, it } from "vitest";
import { extractReadableArticle } from "./extract-web-text";

const SAMPLE = `<!DOCTYPE html><html><head><title>Test Article</title></head><body>
<article><h1>Main headline</h1>
<p>${"Paragraph one with enough content. ".repeat(20)}</p>
<p>${"Paragraph two continues the story. ".repeat(20)}</p>
<p>${"Paragraph three wraps up. ".repeat(15)}</p>
</article></body></html>`;

describe("extractReadableArticle", () => {
  it("extracts multi-paragraph article text", () => {
    const result = extractReadableArticle(SAMPLE, "https://example.com/post");
    expect(result).not.toBeNull();
    expect(result!.full_text).toBe(true);
    expect(result!.text.length).toBeGreaterThan(500);
    expect(result!.text).toContain("Paragraph two");
  });
});
