export type SourceCredit = {
  author: string | null;
  title: string | null;
  url: string;
  platform: string;
};

export function buildSourcesMarkdown(sources: SourceCredit[]): string {
  if (!sources.length) return "";
  const lines = sources.map((s, i) => {
    const label = s.author ?? s.title ?? "Source";
    const platform =
      s.platform === "x" ? "X" : s.platform === "threads" ? "Threads" : "Web";
    const desc = s.title && s.author ? s.title : s.title ?? s.url;
    return `${i + 1}. **${label}** on ${platform} — ${desc} (${s.url})`;
  });
  return `## Sources\n\n${lines.join("\n")}`;
}

export function appendSourcesToBody(body: string, sourcesBlock: string): string {
  const marker = "## Sources";
  if (body.includes(marker)) {
    return body.replace(/## Sources[\s\S]*$/m, sourcesBlock.trim());
  }
  return `${body.trim()}\n\n${sourcesBlock}`.trim();
}
