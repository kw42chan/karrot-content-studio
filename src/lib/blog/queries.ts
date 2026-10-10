import type { PostCategory } from "@/lib/blog/categories";
import { filterPublicPosts } from "@/lib/blog/public-posts";
import type { PublicBlogPost } from "@/lib/blog/types";

export type GridCard = { kind: "post"; post: PublicBlogPost };

export function sortPostsNewest(posts: PublicBlogPost[]): PublicBlogPost[] {
  return [...posts].sort((a, b) => {
    const ta = a.published_at ? Date.parse(a.published_at) : 0;
    const tb = b.published_at ? Date.parse(b.published_at) : 0;
    return tb - ta;
  });
}

export function countByCategory(
  posts: PublicBlogPost[],
  featuredSlug: string | null = null,
): Record<PostCategory | "all", number> {
  const gridPosts = featuredSlug
    ? posts.filter((p) => p.slug !== featuredSlug)
    : posts;
  const counts: Record<PostCategory | "all", number> = {
    all: gridPosts.length,
    "ai-tools": 0,
    automation: 0,
    "account-security": 0,
    "case-studies": 0,
  };
  for (const p of gridPosts) {
    if (p.category) counts[p.category]++;
  }
  return counts;
}

export function buildIndexGrid(
  posts: PublicBlogPost[],
  featuredSlug: string | null,
): GridCard[] {
  const gridPosts = posts.filter((p) => p.slug !== featuredSlug);
  return gridPosts.map((p) => ({ kind: "post", post: p }));
}

export function filterGridCards(cards: GridCard[], category: PostCategory | "all"): GridCard[] {
  if (category === "all") return cards;
  return cards.filter((c) => c.post.category === category);
}

export type RelatedCard = { kind: "post"; post: PublicBlogPost; previous: boolean };

export function buildMoreInCategory(
  allPublished: PublicBlogPost[],
  current: PublicBlogPost,
  limit = 3,
): RelatedCard[] {
  const sorted = filterPublicPosts(sortPostsNewest(allPublished));
  const picked: RelatedCard[] = [];

  const pushPost = (p: PublicBlogPost, previous: boolean) => {
    if (picked.length >= limit) return;
    if (p.slug === current.slug) return;
    if (picked.some((x) => x.post.slug === p.slug)) return;
    picked.push({ kind: "post", post: p, previous });
  };

  for (const p of sorted) {
    if (p.category && p.category === current.category) pushPost(p, false);
  }

  for (const p of sorted) {
    if (!p.category || p.category !== current.category) pushPost(p, true);
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
