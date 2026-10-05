import type { DistributionChannel, SuggestionChannel } from "@/lib/studio/channels";

export type BlogLengthPref = "short" | "standard" | "indepth";
export type BlogCoveragePref = "summarize" | "follow_sources";
export type XLengthPref = "single" | "thread_3" | "thread_5" | "thread_8";
export type ThreadsLengthPref = "short" | "full";
export type InstagramLengthPref = "short" | "medium" | "long";

export type ChannelGenerationPrefs = {
  blog: { length: BlogLengthPref; coverage: BlogCoveragePref };
  x: { mode: XLengthPref };
  threads: { length: ThreadsLengthPref };
  instagram: { length: InstagramLengthPref };
};

export type PostGenerationPrefs = Partial<ChannelGenerationPrefs>;

export const DEFAULT_GENERATION_PREFS: ChannelGenerationPrefs = {
  blog: { length: "standard", coverage: "summarize" },
  x: { mode: "single" },
  threads: { length: "full" },
  instagram: { length: "medium" },
};

export function normalizeGenerationPrefs(raw: unknown): ChannelGenerationPrefs {
  const r = (raw && typeof raw === "object" ? raw : {}) as PostGenerationPrefs;
  return {
    blog: {
      length: r.blog?.length ?? DEFAULT_GENERATION_PREFS.blog.length,
      coverage: r.blog?.coverage ?? DEFAULT_GENERATION_PREFS.blog.coverage,
    },
    x: { mode: r.x?.mode ?? DEFAULT_GENERATION_PREFS.x.mode },
    threads: { length: r.threads?.length ?? DEFAULT_GENERATION_PREFS.threads.length },
    instagram: { length: r.instagram?.length ?? DEFAULT_GENERATION_PREFS.instagram.length },
  };
}

export function prefsForDistributionChannel(
  prefs: ChannelGenerationPrefs,
  channel: DistributionChannel,
): ChannelGenerationPrefs[keyof ChannelGenerationPrefs] {
  return prefs[channel];
}

export function suggestionChannelPrefs(
  prefs: ChannelGenerationPrefs,
  channel: SuggestionChannel,
): ChannelGenerationPrefs[keyof ChannelGenerationPrefs] {
  if (channel === "blog") return prefs.blog;
  if (channel === "x") return prefs.x;
  if (channel === "threads") return prefs.threads;
  return prefs.instagram;
}

export function blogMaxTokens(length: BlogLengthPref): number {
  switch (length) {
    case "short":
      return 2048;
    case "standard":
      return 4096;
    case "indepth":
      return 16384;
  }
}

export function blogLengthPrompt(length: BlogLengthPref): string {
  switch (length) {
    case "short":
      return "Length: SHORT — about 300 words. Key points only; no long anecdotes.";
    case "standard":
      return "Length: STANDARD — about 700 words. Balanced depth with clear sections.";
    case "indepth":
      return "Length: IN-DEPTH — at least 1,500 words. Cover every substantive point from each source with details, examples, and numbers where present. Do not omit major arguments from any source.";
  }
}

export function blogCoveragePrompt(coverage: BlogCoveragePref): string {
  switch (coverage) {
    case "summarize":
      return "Coverage: SUMMARIZE — condense sources into a cohesive narrative; merge overlapping ideas.";
    case "follow_sources":
      return "Coverage: FOLLOW SOURCES CLOSELY — preserve the structure and all main points of each source (paraphrased, not quoted at length). Give each source fair weight. End with a ## Sources section listing numbered credits with URLs.";
  }
}
