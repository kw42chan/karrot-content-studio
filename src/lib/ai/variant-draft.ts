import { normalizeVariantResult } from "@/lib/ai/normalize-variant-result";
import { completeJson } from "@/lib/ai/llm-json";
import { formatSourceBundlesForPrompt } from "@/lib/sources/chunk-for-ai";
import { sourceTextForAi } from "@/lib/sources/text-for-ai";
import type { SuggestionChannel } from "@/lib/studio/channels";
import type {
  ChannelGenerationPrefs,
  InstagramLengthPref,
  ThreadsLengthPref,
  XLengthPref,
} from "@/lib/studio/generation-prefs";

type SourceBundle = {
  author: string | null;
  title: string | null;
  url: string;
  summaryEn: string;
  summaryZh: string;
  fullText: string;
};

type VariantResult = {
  content: string;
  extra?: { thread_parts?: string[]; social_title?: string; key_point?: string };
};

export async function draftVariantFromSources(params: {
  channel: SuggestionChannel;
  postTitle: string;
  language: "zh-HK" | "en";
  sources: SourceBundle[];
  currentContent?: string;
  prefs: ChannelGenerationPrefs;
}): Promise<VariantResult> {
  if (params.channel === "blog") {
    throw new Error("Use draftPostBody for blog");
  }

  const sourcesBlock = params.sources
    .map(
      (s, i) =>
        `${i + 1}. ${s.author ?? "Unknown"} — ${s.title ?? s.url}\n${sourceTextForAi(s.fullText, 12000)}`,
    )
    .join("\n\n");

  const channelSpec = channelPrompt(params.channel, params.language, params.prefs);
  const prompt = `You write social copy for Karrot Digital (Darwin Chan), Hong Kong AI consultancy.
Voice: practical, plain, no hype.
${channelSpec}
Never include "My take" content.
Return JSON only.

Post title: ${params.postTitle}
Current draft for this channel (if any): ${params.currentContent ?? "(empty)"}

Sources:
${sourcesBlock}`;

  const parsed = await completeJson<Record<string, unknown>>({
    prompt,
    maxTokens: maxTokensForChannel(params.channel, params.prefs),
    offline: () => offlineVariant(params.channel, params.postTitle, undefined, params.prefs),
  });
  return normalizeVariantResult(params.channel, parsed);
}

export async function generateVariantFromBlog(params: {
  channel: SuggestionChannel;
  postTitle: string;
  blogBody: string;
  language: "zh-HK" | "en";
  prefs: ChannelGenerationPrefs;
}): Promise<VariantResult> {
  if (params.channel === "blog") throw new Error("Invalid channel");

  const channelSpec = channelPrompt(params.channel, params.language, params.prefs);
  const prompt = `Adapt the blog post below into social copy for Karrot Digital.
${channelSpec}
Do not include My take. Return JSON only.

Title: ${params.postTitle}
Blog body:
${params.blogBody.slice(0, 20000)}`;

  const snippet = params.blogBody.slice(0, 200);
  const parsed = await completeJson<Record<string, unknown>>({
    prompt,
    maxTokens: maxTokensForChannel(params.channel, params.prefs),
    offline: () => offlineVariant(params.channel, params.postTitle, snippet, params.prefs),
  });
  return normalizeVariantResult(params.channel, parsed);
}

export async function adjustVariantContent(params: {
  channel: SuggestionChannel;
  adjust: "shorter" | "longer" | "more_detail";
  postTitle: string;
  language: "zh-HK" | "en";
  currentContent: string;
  currentExtra?: VariantResult["extra"];
  sources?: SourceBundle[];
  prefs: ChannelGenerationPrefs;
}): Promise<VariantResult> {
  const adjustLine =
    params.adjust === "shorter"
      ? "Make this copy SHORTER while keeping the core message."
      : params.adjust === "longer"
        ? "Make this copy LONGER with more useful detail (still within channel limits)."
        : "Add MORE DETAIL from the sources below; keep channel format.";

  const sourcesBlock =
    params.adjust === "more_detail" && params.sources?.length
      ? `\nSources:\n${formatSourceBundlesForPrompt(params.sources, { perChunkMax: 10000, inDepth: true })}`
      : "";

  const channelSpec = channelPrompt(params.channel, params.language, params.prefs);

  const parsed = await completeJson<Record<string, unknown>>({
    prompt: `Revise ${params.channel} copy. Never mention My take.
${adjustLine}
${channelSpec}
Return the full revised JSON for this channel.

Title: ${params.postTitle}
Current JSON fields — content: ${params.currentContent}
extra: ${JSON.stringify(params.currentExtra ?? {})}${sourcesBlock}`,
    maxTokens: maxTokensForChannel(params.channel, params.prefs),
    offline: () => ({
      content: params.currentContent,
      extra: params.currentExtra,
    }),
  });
  return normalizeVariantResult(params.channel, parsed);
}

export async function reviseVariantFromComments(params: {
  channel: SuggestionChannel;
  postTitle: string;
  language: "zh-HK" | "en";
  currentContent: string;
  comments: string[];
}): Promise<string> {
  const joined = params.comments.map((c, i) => `${i + 1}. ${c}`).join("\n");

  const parsed = await completeJson<{ paragraph: string }>({
    prompt: `Revise ${params.channel} post copy based on editor comments. Return JSON: { "paragraph": "revised full text for this channel" }
Language: ${params.language === "zh-HK" ? "Traditional Chinese 香港書面語" : "English"}
Never mention My take.

Title: ${params.postTitle}
Current: ${params.currentContent}
Comments:
${joined}`,
    maxTokens: 4096,
    offline: () => ({ paragraph: `${params.currentContent}\n\n(${params.comments[0] ?? "comment"})` }),
  });
  return parsed.paragraph;
}

function maxTokensForChannel(channel: SuggestionChannel, prefs: ChannelGenerationPrefs): number {
  if (channel === "zh" || channel === "en") {
    if (prefs.instagram.length === "long") return 4096;
    if (prefs.instagram.length === "medium") return 2048;
    return 1024;
  }
  if (channel === "threads") return 1024;
  if (channel === "x") {
    const mode = prefs.x.mode;
    if (mode === "thread_8") return 2048;
    if (mode === "thread_5") return 1536;
    if (mode === "thread_3") return 1280;
    return 512;
  }
  return 4096;
}

function languageLine(language: "zh-HK" | "en"): string {
  return language === "zh-HK"
    ? "Write in Traditional Chinese (香港書面語)."
    : "Write in English.";
}

function channelPrompt(
  channel: SuggestionChannel,
  language: "zh-HK" | "en",
  prefs: ChannelGenerationPrefs,
): string {
  switch (channel) {
    case "x":
      return xPrompt(prefs.x.mode, language);
    case "threads":
      return threadsPrompt(prefs.threads.length, language);
    case "zh":
      return instagramPrompt("zh", prefs.instagram.length);
    case "en":
      return instagramPrompt("en", prefs.instagram.length);
    default:
      return "";
  }
}

function xPrompt(mode: XLengthPref, language: "zh-HK" | "en"): string {
  const lang = languageLine(language);
  if (mode === "single") {
    return `Channel: X (Twitter). Single post only, max 280 characters. ${lang}
Return JSON: { "content": "tweet", "extra": { "thread_parts": [] } }`;
  }
  const n = mode === "thread_3" ? 3 : mode === "thread_5" ? 5 : 8;
  return `Channel: X (Twitter). Write a THREAD of exactly ${n} posts. ${lang}
Post 1 is "content" (max 280 chars). Posts 2-${n} go in extra.thread_parts (each max 280 chars).
Return JSON: { "content": "tweet 1", "extra": { "thread_parts": ["tweet 2", ...] } }`;
}

function threadsPrompt(length: ThreadsLengthPref, language: "zh-HK" | "en"): string {
  const lang = languageLine(language);
  if (length === "short") {
    return `Channel: Threads. SHORT post — under 200 characters total. ${lang}
Return JSON: { "content": "threads post text" }`;
  }
  return `Channel: Threads. FULL post — up to 500 characters, use the space for substance. ${lang}
Return JSON: { "content": "threads post text" }`;
}

function instagramPrompt(locale: "zh" | "en", length: InstagramLengthPref): string {
  const lang =
    locale === "zh"
      ? "Traditional Chinese (香港書面語)"
      : "English";
  const size =
    length === "short"
      ? "SHORT — about 80 words"
      : length === "medium"
        ? "MEDIUM — about 150 words"
        : "LONG — about 300 words (hard max 2,200 characters)";
  return `Channel: Instagram/Facebook caption in ${lang}. Length: ${size}.
Return JSON: { "content": "caption", "extra": { "social_title": "short headline for image", "key_point": "one sentence for image" } }`;
}

function offlineVariant(
  channel: SuggestionChannel,
  title: string,
  snippet?: string,
  prefs?: ChannelGenerationPrefs,
): VariantResult {
  const base = snippet ?? title;
  switch (channel) {
    case "x": {
      const parts =
        prefs?.x.mode && prefs.x.mode !== "single"
          ? Array.from({ length: (prefs.x.mode === "thread_3" ? 2 : prefs.x.mode === "thread_5" ? 4 : 7) }, (_, i) =>
              `${title} (${i + 2})`.slice(0, 280),
            )
          : [];
      return { content: base.slice(0, 280), extra: { thread_parts: parts } };
    }
    case "threads": {
      const max = prefs?.threads.length === "short" ? 200 : 500;
      return { content: base.slice(0, max) };
    }
    case "zh":
    case "en": {
      const max =
        prefs?.instagram.length === "short"
          ? 400
          : prefs?.instagram.length === "long"
            ? 1200
            : 800;
      return {
        content: base.slice(0, max),
        extra: { social_title: title.slice(0, 40), key_point: base.slice(0, 120) },
      };
    }
    default:
      return { content: base };
  }
}
