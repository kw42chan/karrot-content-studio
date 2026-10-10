/** Distribution surface (channel tabs in editor chrome). */
export type DistributionChannel = "blog" | "x" | "threads" | "instagram";

export const DISTRIBUTION_CHANNELS: { id: DistributionChannel; label: string }[] = [
  { id: "blog", label: "Blog" },
  { id: "x", label: "X" },
  { id: "threads", label: "Threads" },
  { id: "instagram", label: "Instagram" },
];

export type ContentLocale = "zh-HK" | "en";

/** Stored in studio_post_variants.channel */
export type VariantStorageChannel = "x" | "threads" | "zh" | "en";

/** Stored in studio_suggestions.channel */
export type SuggestionChannel = "blog" | VariantStorageChannel;

/** @deprecated Use DistributionChannel in UI; SuggestionChannel in DB */
export type StudioChannel = SuggestionChannel;

export type VariantExtra = {
  thread_parts?: string[];
  social_title?: string;
  key_point?: string;
  aspect?: "square" | "portrait";
};

export type PostVariantRecord = {
  channel: VariantStorageChannel;
  content: string;
  extra: VariantExtra;
};

export function variantKeyFor(
  channel: DistributionChannel,
  locale: ContentLocale,
): VariantStorageChannel | null {
  if (channel === "blog") return null;
  if (channel === "x") return "x";
  if (channel === "threads") return "threads";
  return locale === "zh-HK" ? "zh" : "en";
}

export function suggestionChannelFor(
  channel: DistributionChannel,
  locale: ContentLocale,
): SuggestionChannel {
  const key = variantKeyFor(channel, locale);
  return key ?? "blog";
}

export function emptyVariant(channel: VariantStorageChannel): PostVariantRecord {
  return {
    channel,
    content: "",
    extra: channel === "x" ? { thread_parts: [] } : {},
  };
}
