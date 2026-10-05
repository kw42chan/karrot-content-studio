export type StudioChannel = "blog" | "x" | "threads" | "zh" | "en";

export const STUDIO_TABS: { id: StudioChannel; label: string }[] = [
  { id: "blog", label: "Blog" },
  { id: "x", label: "X post" },
  { id: "threads", label: "Threads" },
  { id: "zh", label: "中文" },
  { id: "en", label: "English" },
];

export type VariantExtra = {
  thread_parts?: string[];
  social_title?: string;
  key_point?: string;
};

export type PostVariantRecord = {
  channel: StudioChannel;
  content: string;
  extra: VariantExtra;
};

export function emptyVariant(channel: StudioChannel): PostVariantRecord {
  return { channel, content: "", extra: {} };
}
