const CJK_PER_MIN = 325;
const EN_WORDS_PER_MIN = 220;

function stripSourcesSection(body: string): string {
  return body.replace(/\n## Sources[\s\S]*$/m, "").trim();
}

function countCjkChars(text: string): number {
  const matches = text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g);
  return matches?.length ?? 0;
}

function countEnglishWords(text: string): number {
  const latin = text.replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, " ");
  const words = latin.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

/** Estimate read time in minutes (min 1). */
export function computeReadTimeMinutes(body: string, language: "zh-HK" | "en"): number {
  const text = stripSourcesSection(body);
  if (!text) return 1;

  if (language === "zh-HK") {
    const cjk = countCjkChars(text);
    const latinWords = countEnglishWords(text);
    const fromCjk = cjk / CJK_PER_MIN;
    const fromLatin = latinWords / EN_WORDS_PER_MIN;
    return Math.max(1, Math.ceil(fromCjk + fromLatin));
  }

  const words = countEnglishWords(text) + Math.ceil(countCjkChars(text) / 2);
  return Math.max(1, Math.ceil(words / EN_WORDS_PER_MIN));
}
