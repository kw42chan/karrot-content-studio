import type { PostCategory } from "@/lib/blog/categories";

export type SamplePostCard = {
  id: string;
  sample: true;
  category: PostCategory;
  title: string;
  excerpt: string;
  dateLabel: string;
  readTime: number;
  coverLabel?: string;
};

export const SAMPLE_POST_CARDS: SamplePostCard[] = [
  {
    id: "sample-ai-tools",
    sample: true,
    category: "ai-tools",
    title: "Example post — Choosing an AI assistant for a small team",
    excerpt:
      "Placeholder excerpt. One or two sentences that tell the reader what they will learn. Replace with a real post.",
    dateLabel: "Sep 2026",
    readTime: 5,
  },
  {
    id: "sample-automation",
    sample: true,
    category: "automation",
    title: "Example post — Automating client onboarding end to end",
    excerpt:
      "Placeholder excerpt. Shows how an automation-category card looks with a two-line title. Replace with a real post.",
    dateLabel: "Aug 2026",
    readTime: 6,
  },
  {
    id: "sample-security",
    sample: true,
    category: "account-security",
    title: "Example post — Securing shared AI logins for your team",
    excerpt:
      'Placeholder excerpt. Gives "More in Account & security" a second item on the post page. Replace with a real post.',
    dateLabel: "Jul 2026",
    readTime: 3,
  },
  {
    id: "sample-case",
    sample: true,
    category: "case-studies",
    title: "Example post — How a Hong Kong retailer cut admin hours",
    excerpt:
      "Placeholder excerpt. Case studies should name the client type, the problem and the result. Replace with a real post.",
    dateLabel: "Jun 2026",
    readTime: 7,
  },
];
