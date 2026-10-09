export const POST_CATEGORIES = [
  "ai-tools",
  "automation",
  "account-security",
  "case-studies",
] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];

const LABELS: Record<PostCategory, string> = {
  "ai-tools": "AI tools",
  automation: "Automation",
  "account-security": "Account & security",
  "case-studies": "Case studies",
};

export function categoryLabel(category: PostCategory | string | null | undefined): string {
  if (!category) return "Uncategorized";
  return LABELS[category as PostCategory] ?? category;
}

export function categoryHref(category: PostCategory): string {
  return `/p?category=${category}`;
}
