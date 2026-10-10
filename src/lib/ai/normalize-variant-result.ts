import type { SuggestionChannel } from "@/lib/studio/channels";

export type NormalizedVariantResult = {
  content: string;
  extra: {
    thread_parts?: string[];
    social_title?: string;
    key_point?: string;
    aspect?: "square" | "portrait";
  };
};

export function normalizeVariantResult(
  channel: SuggestionChannel,
  raw: Record<string, unknown>,
): NormalizedVariantResult {
  const extraRaw = (raw.extra as Record<string, unknown> | undefined) ?? {};
  const content =
    typeof raw.content === "string"
      ? raw.content
      : typeof raw.paragraph === "string"
        ? raw.paragraph
        : typeof raw.text === "string"
          ? raw.text
          : "";

  const threadParts = Array.isArray(extraRaw.thread_parts)
    ? extraRaw.thread_parts.map((p) => String(p))
    : channel === "x"
      ? []
      : undefined;

  return {
    content: content.trim(),
    extra: {
      ...(threadParts ? { thread_parts: threadParts } : {}),
      ...(typeof extraRaw.social_title === "string"
        ? { social_title: extraRaw.social_title }
        : {}),
      ...(typeof extraRaw.key_point === "string" ? { key_point: extraRaw.key_point } : {}),
      ...(extraRaw.aspect === "square" || extraRaw.aspect === "portrait"
        ? { aspect: extraRaw.aspect }
        : {}),
    },
  };
}
