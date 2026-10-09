import { getOpenRouterKey, getOpenRouterModel, getSiteUrl } from "@/lib/env";

export async function completeJson<T>(params: {
  prompt: string;
  maxTokens?: number;
  offline?: () => T;
}): Promise<T> {
  const apiKey = getOpenRouterKey();
  if (!apiKey) {
    if (params.offline) return params.offline();
    throw new Error("OPENROUTER_API_KEY is not set");
  }

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
      messages: [{ role: "user", content: params.prompt }],
      response_format: { type: "json_object" },
      max_tokens: params.maxTokens ?? 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter error: ${res.status} ${err}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty OpenRouter response");
  return JSON.parse(content) as T;
}

export async function completeText(params: {
  prompt: string;
  maxTokens?: number;
}): Promise<{ content: string }> {
  const apiKey = getOpenRouterKey();
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

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
      messages: [{ role: "user", content: params.prompt }],
      max_tokens: params.maxTokens ?? 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter error: ${res.status} ${err}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty OpenRouter response");
  return { content };
}

export function parseSections(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /^===([A-Z_]+)===\s*$/gm;
  const matches = [...text.matchAll(re)];
  for (let i = 0; i < matches.length; i++) {
    const key = matches[i][1];
    const start = matches[i].index! + matches[i][0].length;
    const end = matches[i + 1]?.index ?? text.length;
    out[key] = text.slice(start, end).trim();
  }
  return out;
}
