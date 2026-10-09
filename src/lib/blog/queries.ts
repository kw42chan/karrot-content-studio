import type { PostCategory } from "@/lib/blog/categories";
import { filterPublicPosts } from "@/lib/blog/public-posts";
import { SAMPLE_POST_CARDS, type SamplePostCard } from "@/lib/blog/sample-posts";
import type { PublicBlogPost } from "@/lib/blog/types";

export type GridCard =
  | { kind: "post"; post: PublicBlogPost }
  | { kind: "sample"; post: SamplePostCard };

export function sortPostsNewest(posts: PublicBlogPost[]): PublicBlogPost[] {
  return [...posts].sort((a, b) => {
    const ta = a.published_at ? Date.parse(a.published_at) : 0;
    const tb = b.published_at ? Date.parse(b.published_at) : 0;
    return tb - ta;
  });
}

export function countByCategory(
  posts: PublicBlogPost[],
  includeSamples: boolean,
): Record<PostCategory | "all", number> {
  const counts: Record<PostCategory | "all", number> = {
    all: posts.length,
    "ai-tools": 0,
    automation: 0,
    "account-security": 0,
    "case-studies": 0,
  };
  for (const p of posts) {
    if (p.category) counts[p.category]++;
  }
  if (includeSamples) {
    counts.all += SAMPLE_POST_CARDS.length;
    for (const s of SAMPLE_POST_CARDS) counts[s.category]++;
  }
  return counts;
}

export function shouldShowSampleCards(publishedCount: number): boolean {
  return publishedCount < 4;
}

export function buildIndexGrid(
  posts: PublicBlogPost[],
  featuredSlug: string | null,
  includeSamples: boolean,
): GridCard[] {
  const gridPosts = posts.filter((p) => p.slug !== featuredSlug);
  const cards: GridCard[] = gridPosts.map((p) => ({ kind: "post", post: p }));
  if (includeSamples) {
    for (const sample of SAMPLE_POST_CARDS) {
      cards.push({ kind: "sample", post: sample });
    }
  }
  return cards;
}

export function filterGridCards(cards: GridCard[], category: PostCategory | "all"): GridCard[] {
  if (category === "all") return cards;
  return cards.filter((c) => {
    if (c.kind === "sample") return c.post.category === category;
    return c.post.category === category;
  });
}

export type RelatedCard =
  | { kind: "post"; post: PublicBlogPost; previous: boolean }
  | { kind: "sample"; post: SamplePostCard; previous?: boolean };

export function buildMoreInCategory(
  allPublished: PublicBlogPost[],
  current: PublicBlogPost,
  includeSamples: boolean,
  limit = 3,
): RelatedCard[] {
  const sorted = filterPublicPosts(sortPostsNewest(allPublished));
  const picked: RelatedCard[] = [];
  const usedSampleIds = new Set<string>();

  const pushPost = (p: PublicBlogPost, previous: boolean) => {
    if (picked.length >= limit) return;
    if (p.slug === current.slug) return;
    if (picked.some((x) => x.kind === "post" && x.post.slug === p.slug)) return;
    picked.push({ kind: "post", post: p, previous });
  };

  const pushSample = (s: SamplePostCard, previous: boolean) => {
    if (picked.length >= limit) return;
    if (usedSampleIds.has(s.id)) return;
    usedSampleIds.add(s.id);
    picked.push({ kind: "sample", post: s, previous });
  };

  for (const p of sorted) {
    if (p.category && p.category === current.category) pushPost(p, false);
  }

  if (includeSamples && picked.length < limit) {
    for (const s of SAMPLE_POST_CARDS) {
      if (s.category !== current.category) continue;
      pushSample(s, false);
    }
  }

  for (const p of sorted) {
    if (!p.category || p.category !== current.category) pushPost(p, true);
  }

  if (includeSamples && picked.length < limit) {
    for (const s of SAMPLE_POST_CARDS) {
      if (s.category === current.category) continue;
      pushSample(s, true);
    }
  }

  return picked.slice(0, limit);
}

export function adjacentPosts(
  allPublished: PublicBlogPost[],
  currentSlug: string,
): { prev: PublicBlogPost | null; next: PublicBlogPost | null } {
  const sorted = filterPublicPosts(sortPostsNewest(allPublished));
  const idx = sorted.findIndex((p) => p.slug === currentSlug);
  if (idx < 0) return { prev: null, next: null };
  return {
    prev: sorted[idx + 1] ?? null,
    next: sorted[idx - 1] ?? null,
  };
}
