/** Trim source text for prompts while keeping substantive coverage. */
export function sourceTextForAi(text: string, maxChars = 28000): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;

  const head = Math.floor(maxChars * 0.65);
  const tail = maxChars - head - 80;
  return `${trimmed.slice(0, head)}\n\n[… middle trimmed for length …]\n\n${trimmed.slice(-tail)}`;
}
