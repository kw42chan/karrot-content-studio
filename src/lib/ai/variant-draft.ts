import { getOpenRouterKey, getOpenRouterModel, getSiteUrl } from "@/lib/env";
import { sourceTextForAi } from "@/lib/sources/text-for-ai";
import type { SuggestionChannel } from "@/lib/studio/channels";

type SourceBundle = {
  author: string | null;
  title: string | null;
  url: string;
  summaryEn: string;
  summaryZh: string;
  fullText: string;
};

export async function draftVariantFromSources(params: {
  channel: SuggestionChannel;
  postTitle: string;
  language: "zh-HK" | "en";
  sources: SourceBundle[];
  currentContent?: string;
}): Promise<{ content: string; extra?: { thread_parts?: string[]; social_title?: string; key_point?: string } }> {
  if (params.channel === "blog") {
    throw new Error("Use draftPostBody for blog");
  }

  const apiKey = getOpenRouterKey();
  const sourcesBlock = params.sources
    .map(
      (s, i) =>
        `${i + 1}. ${s.author ?? "Unknown"} — ${s.title ?? s.url}\n${sourceTextForAi(s.fullText, 10000)}`,
    )
    .join("\n\n");

  if (!apiKey) {
    return offlineVariant(params.channel, params.postTitle);
  }

  const channelSpec = channelPrompt(params.channel, params.language);
  const prompt = `You write social copy for Karrot Digital (Darwin Chan), Hong Kong AI consultancy.
Voice: practical, plain, no hype.
${channelSpec}
Never include "My take" content.
Return JSON only.

Post title: ${params.postTitle}
Current draft for this channel (if any): ${params.currentContent ?? "(empty)"}

Sources:
${sourcesBlock}`;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": getSiteUrl(),
      "X-Title": "Karrot Content Studio",
    },
    body: JSON.stringify({
      model: getOpenRouterModel(),
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter variant draft failed: ${res.status}`);
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty variant response");
  return JSON.parse(content) as {
    content: string;
    extra?: { thread_parts?: string[]; social_title?: string; key_point?: string };
  };
}

export async function generateVariantFromBlog(params: {
  channel: SuggestionChannel;
  postTitle: string;
  blogBody: string;
  language: "zh-HK" | "en";
}): Promise<{ content: string; extra?: { thread_parts?: string[]; social_title?: string; key_point?: string } }> {
  if (params.channel === "blog") throw new Error("Invalid channel");

  const apiKey = getOpenRouterKey();
  if (!apiKey) {
    const snippet = params.blogBody.slice(0, 200);
    return offlineVariant(params.channel, params.postTitle, snippet);
  }

  const channelSpec = channelPrompt(params.channel, params.language);
  const prompt = `Adapt the blog post below into social copy for Karrot Digital.
${channelSpec}
Do not include My take. Return JSON only.

Title: ${params.postTitle}
Blog body:
${params.blogBody.slice(0, 12000)}`;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": getSiteUrl(),
      "X-Title": "Karrot Content Studio",
    },
    body: JSON.stringify({
      model: getOpenRouterModel(),
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) throw new Error(`Generate from blog failed: ${res.status}`);
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response");
  return JSON.parse(content) as {
    content: string;
    extra?: { thread_parts?: string[]; social_title?: string; key_point?: string };
  };
}

export async function reviseVariantFromComments(params: {
  channel: SuggestionChannel;
  postTitle: string;
  language: "zh-HK" | "en";
  currentContent: string;
  comments: string[];
}): Promise<string> {
  const apiKey = getOpenRouterKey();
  const joined = params.comments.map((c, i) => `${i + 1}. ${c}`).join("\n");
  if (!apiKey) {
    return `${params.currentContent}\n\n(${params.comments[0] ?? "comment"})`;
  }

  const prompt = `Revise ${params.channel} post copy based on editor comments. Return JSON: { "paragraph": "revised full text for this channel" }
Language: ${params.language === "zh-HK" ? "Traditional Chinese 香港書面語" : "English"}
Never mention My take.

Title: ${params.postTitle}
Current: ${params.currentContent}
Comments:
${joined}`;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": getSiteUrl(),
      "X-Title": "Karrot Content Studio",
    },
    body: JSON.stringify({
      model: getOpenRouterModel(),
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty comment revision");
  const parsed = JSON.parse(content) as { paragraph: string };
  return parsed.paragraph;
}

function channelPrompt(channel: SuggestionChannel, language: "zh-HK" | "en"): string {
  switch (channel) {
    case "x":
      return `Channel: X (Twitter). Max 280 characters for the main post. Return JSON: { "content": "main tweet", "extra": { "thread_parts": ["optional tweet 2", ...] } }`;
    case "threads":
      return `Channel: Threads. Max 500 characters. Return JSON: { "content": "threads post text" }`;
    case "zh":
      return `Channel: Instagram/Facebook caption in Traditional Chinese (香港書面語). Return JSON: { "content": "caption", "extra": { "social_title": "short headline for image", "key_point": "one sentence for image" } }`;
    case "en":
      return `Channel: Instagram/Facebook caption in English. Return JSON: { "content": "caption", "extra": { "social_title": "short headline for image", "key_point": "one sentence for image" } }`;
    default:
      return "";
  }
}

function offlineVariant(
  channel: SuggestionChannel,
  title: string,
  snippet?: string,
): { content: string; extra?: { thread_parts?: string[]; social_title?: string; key_point?: string } } {
  const base = snippet ?? title;
  switch (channel) {
    case "x":
      return { content: base.slice(0, 280), extra: { thread_parts: [] } };
    case "threads":
      return { content: base.slice(0, 500) };
    case "zh":
      return {
        content: base.slice(0, 400),
        extra: { social_title: title.slice(0, 40), key_point: base.slice(0, 120) },
      };
    case "en":
      return {
        content: base.slice(0, 400),
        extra: { social_title: title.slice(0, 40), key_point: base.slice(0, 120) },
      };
    default:
      return { content: base };
  }
}
