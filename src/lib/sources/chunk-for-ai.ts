import { sourceTextForAi } from "@/lib/sources/text-for-ai";

/** Split long text into chunks for multi-part prompts (in-depth drafts). */
export function chunkText(text: string, chunkSize = 12000): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.length <= chunkSize) return [trimmed];

  const chunks: string[] = [];
  const paragraphs = trimmed.split(/\n{2,}/);
  let current = "";

  for (const p of paragraphs) {
    const block = p.trim();
    if (!block) continue;
    if (`${current}\n\n${block}`.length > chunkSize && current) {
      chunks.push(current.trim());
      current = block;
    } else {
      current = current ? `${current}\n\n${block}` : block;
    }
    if (current.length > chunkSize) {
      while (current.length > chunkSize) {
        chunks.push(current.slice(0, chunkSize));
        current = current.slice(chunkSize);
      }
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length ? chunks : [trimmed.slice(0, chunkSize)];
}

export function formatSourceBundlesForPrompt(
  sources: {
    author: string | null;
    title: string | null;
    url: string;
    summaryEn: string;
    summaryZh: string;
    fullText: string;
  }[],
  opts: { perChunkMax: number; inDepth: boolean },
): string {
  return sources
    .map((s, i) => {
      const header = `${i + 1}. ${s.author ?? "Unknown"} — ${s.title ?? s.url}\nURL: ${s.url}\nEN summary: ${s.summaryEn}\nZH summary: ${s.summaryZh}`;
      if (!opts.inDepth) {
        return `${header}\nFull source text:\n${sourceTextForAi(s.fullText, opts.perChunkMax)}`;
      }
      const parts = chunkText(s.fullText, opts.perChunkMax);
      const body = parts
        .map((part, pi) => `--- Source ${i + 1} part ${pi + 1}/${parts.length} ---\n${part}`)
        .join("\n\n");
      return `${header}\nFull source text (all parts — use every part):\n${body}`;
    })
    .join("\n\n\n");
}
