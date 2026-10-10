import { OpenRouterRequestError } from "@/lib/ai/openrouter-errors";
import { completeJson } from "@/lib/ai/llm-json";
import { getOpenRouterKey, getOpenRouterModel, getSiteUrl } from "@/lib/env";
import { formatSourceBundlesForPrompt } from "@/lib/sources/chunk-for-ai";
import type { BilingualSummary } from "@/lib/sources/types";
import fixtureSummaries from "@/lib/fixtures/summaries.json";
import { normalizeSourceUrl } from "@/lib/sources/normalize-url";
import { sourceTextForAi } from "@/lib/sources/text-for-ai";
import type { BlogCoveragePref, BlogLengthPref } from "@/lib/studio/generation-prefs";
import {
  blogCoveragePrompt,
  blogLengthPrompt,
  blogMaxTokens,
} from "@/lib/studio/generation-prefs";

const summarySchema = `{
  "en": { "headline": string, "summary": string, "points": string[] },
  "zh": { "headline": string, "summary": string, "points": string[] }
}`;

export async function summarizeSource(
  sourceUrl: string,
  text: string,
  title?: string | null,
): Promise<BilingualSummary> {
  const normalized = normalizeSourceUrl(sourceUrl);
  const fixtures = fixtureSummaries as Record<string, BilingualSummary>;
  if (fixtures[normalized]) {
    return fixtures[normalized];
  }
  // threads share URL may normalize differently — try without path variants
  for (const [key, val] of Object.entries(fixtures)) {
    if (normalized.includes("EtCKem4fj") && key.includes("EtCKem4fj")) {
      return val;
    }
  }

  const apiKey = getOpenRouterKey();
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const prompt = `You summarize a source for a Hong Kong business consultancy blog. Return ONLY valid JSON matching this shape:
${summarySchema}

Rules:
- en.headline: ~8 words, sentence case, no hype
- en.summary: one plain factual sentence
- en.points: 3-5 bullet strings, facts only from the source
- zh: same fields in Traditional Chinese (香港書面語), Hong Kong terms not mainland, no Cantonese slang
- No hedging, no invented facts

Source title: ${title ?? "(none)"}
Source URL: ${sourceUrl}

Source text:
${sourceTextForAi(text, 12000)}`;

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

  if (!res.ok) {
    const err = await res.text();
    throw new OpenRouterRequestError("summarizeSource", res.status, err);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty OpenRouter response");

  const parsed = JSON.parse(content) as BilingualSummary;
  return parsed;
}

export async function draftPostBody(params: {
  title: string;
  language: "zh-HK" | "en";
  myTake: string;
  length: BlogLengthPref;
  coverage: BlogCoveragePref;
  sources: {
    author: string | null;
    title: string | null;
    url: string;
    summaryEn: string;
    summaryZh: string;
    fullText: string;
  }[];
}): Promise<{ body: string; keyPoint: string; socialCaptions: { zh: string; en: string } }> {
  const apiKey = getOpenRouterKey();
  if (!apiKey) {
    return offlineDraft(params);
  }

  const langNote =
    params.language === "zh-HK"
      ? "Write the blog body in Traditional Chinese (香港書面語) for Hong Kong business owners."
      : "Write the blog body in English for Hong Kong business owners.";

  const inDepth = params.length === "indepth";
  const sourcesBlock = formatSourceBundlesForPrompt(params.sources, {
    perChunkMax: inDepth ? 12000 : 14000,
    inDepth,
  });

  const prompt = `You are writing for Karrot Digital (Darwin Chan), an AI consultancy in Hong Kong.
Voice: practical, plain, respectful of the reader's time. No hype, no AI clichés.
${langNote}
${blogLengthPrompt(params.length)}
${blogCoveragePrompt(params.coverage)}
Do NOT include a "My take" section — that is separate.
End with a short consultancy CTA paragraph inviting readers to book a conversation about AI automation.
Return JSON: { "body": "markdown string with ## subheadings", "keyPoint": "one sentence for social graphic", "socialCaptions": { "zh": "IG/FB caption in Traditional Chinese", "en": "IG/FB caption in English" } }

Post title: ${params.title}
Darwin's my take (for context only, do not copy verbatim): ${params.myTake || "(empty)"}

Sources:
${sourcesBlock}`;

  return completeJson({
    prompt,
    maxTokens: blogMaxTokens(params.length),
    offline: () => offlineDraft(params),
  });
}

export async function adjustBlogBody(params: {
  title: string;
  language: "zh-HK" | "en";
  currentBody: string;
  adjust: "shorter" | "longer" | "more_detail";
  sources?: {
    author: string | null;
    title: string | null;
    url: string;
    summaryEn: string;
    summaryZh: string;
    fullText: string;
  }[];
}): Promise<string> {
  const adjustLine =
    params.adjust === "shorter"
      ? "Make the draft noticeably SHORTER while keeping the main arguments."
      : params.adjust === "longer"
        ? "Make the draft LONGER with more explanation and transitions; do not add fluff."
        : "ADD MORE DETAIL from the attached sources — facts, examples, numbers — without repeating My take.";

  const sourcesBlock =
    params.adjust === "more_detail" && params.sources?.length
      ? `\nSources:\n${formatSourceBundlesForPrompt(params.sources, { perChunkMax: 12000, inDepth: true })}`
      : "";

  const parsed = await completeJson<{ body: string }>({
    prompt: `Revise a blog draft. Never include or rewrite "My take".
${adjustLine}
Language: ${params.language === "zh-HK" ? "Traditional Chinese 香港書面語" : "English"}
Return JSON: { "body": "full revised markdown body (not excerpt)" }

Title: ${params.title}
Current draft:
${params.currentBody.slice(0, 50000)}${sourcesBlock}`,
    maxTokens: params.adjust === "more_detail" ? 16384 : 8192,
    offline: () => ({ body: params.currentBody }),
  });
  return parsed.body;
}

export async function suggestEnrichmentParagraph(params: {
  postTitle: string;
  existingBody: string;
  newSourceSummary: string;
  language: "zh-HK" | "en";
}): Promise<string> {
  const apiKey = getOpenRouterKey();
  if (!apiKey) {
    return params.language === "zh-HK"
      ? "（示範）可加入新來源的一至兩段內容，補充上文未涵蓋的觀點。"
      : "(Demo) A short paragraph you could add from the new source.";
  }

  const prompt = `Suggest ONE new markdown paragraph to enrich an existing blog post when a new source was added.
Do not rewrite the post. Do not change the tone. Facts from the new source only.
Language: ${params.language === "zh-HK" ? "Traditional Chinese 香港書面語" : "English"}
Return JSON: { "paragraph": "..." }

Title: ${params.postTitle}
Existing body (excerpt): ${params.existingBody.slice(0, 4000)}
New source summary: ${params.newSourceSummary}`;

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

  if (!res.ok) {
    const err = await res.text();
    throw new OpenRouterRequestError("suggestEnrichmentParagraph", res.status, err);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty suggestion response");
  const parsed = JSON.parse(content) as { paragraph: string };
  return parsed.paragraph;
}

export async function reviseDraftFromComments(params: {
  postTitle: string;
  language: "zh-HK" | "en";
  draftBody: string;
  comments: string[];
}): Promise<string> {
  const apiKey = getOpenRouterKey();
  const joined = params.comments.map((c, i) => `${i + 1}. ${c}`).join("\n");
  if (!apiKey) {
    return params.language === "zh-HK"
      ? `（依評論修訂示範）\n\n${params.comments[0] ?? ""}`
      : `(Demo revision from comments)\n\n${params.comments[0] ?? ""}`;
  }

  const prompt = `You revise a blog draft based on editor comments. Return JSON: { "paragraph": "markdown paragraphs to INSERT into the draft (not the full post)" }
Rules:
- Never rewrite or mention "My take" — that section is separate and protected.
- Apply the comments to improve the draft body only.
- Language: ${params.language === "zh-HK" ? "Traditional Chinese 香港書面語" : "English"}
- Output only the new/revised markdown sections the editor should add or substitute in the main draft (no Sources section).

Title: ${params.postTitle}
Current draft (excerpt): ${params.draftBody.slice(0, 6000)}
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

  if (!res.ok) {
    const err = await res.text();
    throw new OpenRouterRequestError("reviseDraftFromComments", res.status, err);
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty comment revision response");
  const parsed = JSON.parse(content) as { paragraph: string };
  return parsed.paragraph;
}

function offlineDraft(params: {
  title: string;
  language: "zh-HK" | "en";
  sources: { summaryEn: string; summaryZh: string; fullText?: string }[];
}): { body: string; keyPoint: string; socialCaptions: { zh: string; en: string } } {
  const summary = params.sources[0]?.summaryZh ?? params.sources[0]?.summaryEn ?? "";
  if (params.language === "zh-HK") {
    return {
      body: `## 重點整理\n\n${summary}\n\n## 下一步\n\n如果你想在香港業務中穩陣地採用 AI，歡迎與我預約對談。`,
      keyPoint: summary.slice(0, 120),
      socialCaptions: {
        zh: `${params.title}\n\n${summary}`,
        en: `${params.title}\n\n${params.sources[0]?.summaryEn ?? ""}`,
      },
    };
  }
  const en = params.sources[0]?.summaryEn ?? "";
  return {
    body: `## What matters\n\n${en}\n\n## Next step\n\nBook a conversation if you want practical AI automation for your business.`,
    keyPoint: en.slice(0, 120),
    socialCaptions: { zh: summary, en: `${params.title}\n\n${en}` },
  };
}
