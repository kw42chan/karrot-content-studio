import type { PublicBlogPost } from "@/lib/blog/types";
import type { PostCategory } from "@/lib/blog/categories";
import { SAMPLE_POST_CARDS, type SamplePostCard } from "@/lib/blog/sample-posts";

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
  | { kind: "sample"; post: SamplePostCard };

export function buildMoreInCategory(
  allPublished: PublicBlogPost[],
  current: PublicBlogPost,
  includeSamples: boolean,
  limit = 3,
): RelatedCard[] {
  const sorted = sortPostsNewest(allPublished);
  const same = sorted.filter(
    (p) => p.slug !== current.slug && p.category && p.category === current.category,
  );
  const picked: RelatedCard[] = same.slice(0, limit).map((p) => ({
    kind: "post",
    post: p,
    previous: false,
  }));

  if (picked.length < limit) {
    const rest = sorted.filter(
      (p) =>
        p.slug !== current.slug &&
        (!p.category || p.category !== current.category) &&
        !picked.some((x) => x.kind === "post" && x.post.slug === p.slug),
    );
    for (const p of rest) {
      if (picked.length >= limit) break;
      picked.push({ kind: "post", post: p, previous: true });
    }
  }

  if (picked.length < limit && includeSamples) {
    const samples = SAMPLE_POST_CARDS.filter(
      (s) =>
        s.category === current.category &&
        !picked.some((x) => x.kind === "sample" && x.post.id === s.id),
    );
    for (const s of samples) {
      if (picked.length >= limit) break;
      picked.push({ kind: "sample", post: s });
    }
  }

  return picked.slice(0, limit);
}

export function adjacentPosts(
  allPublished: PublicBlogPost[],
  currentSlug: string,
): { prev: PublicBlogPost | null; next: PublicBlogPost | null } {
  const sorted = sortPostsNewest(allPublished);
  const idx = sorted.findIndex((p) => p.slug === currentSlug);
  if (idx < 0) return { prev: null, next: null };
  return {
    prev: sorted[idx + 1] ?? null,
    next: sorted[idx - 1] ?? null,
  };
}
