"use client";

import { BlogFeatured } from "@/components/blog/blog-featured";
import { BlogPostCard } from "@/components/blog/blog-post-card";
import {
  POST_CATEGORIES,
  categoryLabel,
  type PostCategory,
} from "@/lib/blog/categories";
import { BLOG_INTRO_BLURB } from "@/lib/blog/constants";
import {
  buildIndexGrid,
  countByCategory,
  filterGridCards,
  shouldShowSampleCards,
  type GridCard,
} from "@/lib/blog/queries";
import { filterPublicPosts, pickFeaturedPost } from "@/lib/blog/public-posts";
import type { PublicBlogPost } from "@/lib/blog/types";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export function BlogIndexClient({ posts }: { posts: PublicBlogPost[] }) {
  const searchParams = useSearchParams();
  const [category, setCategory] = useState<PostCategory | "all">("all");

  useEffect(() => {
    const raw = searchParams.get("category");
    if (raw && (POST_CATEGORIES as readonly string[]).includes(raw)) {
      setCategory(raw as PostCategory);
    }
  }, [searchParams]);
  const publicPosts = useMemo(() => filterPublicPosts(posts), [posts]);
  const featured = useMemo(() => pickFeaturedPost(posts), [posts]);
  const includeSamples = shouldShowSampleCards(publicPosts.length);
  const counts = useMemo(
    () => countByCategory(publicPosts, includeSamples),
    [publicPosts, includeSamples],
  );
  const allCards = useMemo(
    () => buildIndexGrid(publicPosts, featured?.slug ?? null, includeSamples),
    [publicPosts, featured, includeSamples],
  );
  const visible = useMemo(() => filterGridCards(allCards, category), [allCards, category]);
  const sampleCount = includeSamples ? allCards.filter((c) => c.kind === "sample").length : 0;

  return (
    <>
      <header className="intro">
        <div>
          <div className="eyebrow">The Karrot Digital blog</div>
          <h1 className="h-anton">Automating Business<br />with Intelligent Tech</h1>
        </div>
        <p>{BLOG_INTRO_BLURB}</p>
      </header>

      {featured && <BlogFeatured post={featured} />}

      <section className="section" id="posts" aria-labelledby="postsTitle">
        <div className="section-head">
          <div>
            <div className="eyebrow">Browse by topic</div>
            <h2 className="section-title h-anton" id="postsTitle" style={{ marginTop: 8 }}>
              All posts
            </h2>
          </div>
          {includeSamples && (
            <span className="sample-note">
              {sampleCount} of {allCards.length} cards are sample data — &quot;Example post&quot;
            </span>
          )}
        </div>
        <div className="filter-bar">
          <div className="chips scroll" role="tablist" aria-label="Filter posts by category">
            <button
              type="button"
              className={`chip ${category === "all" ? "is-active" : ""}`}
              role="tab"
              aria-selected={category === "all"}
              onClick={() => setCategory("all")}
            >
              All <span className="count">{counts.all}</span>
            </button>
            {POST_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`chip ${category === cat ? "is-active" : ""}`}
                role="tab"
                aria-selected={category === cat}
                onClick={() => setCategory(cat)}
              >
                {categoryLabel(cat)} <span className="count">{counts[cat]}</span>
              </button>
            ))}
          </div>
          <span className="result">Newest first</span>
        </div>

        <div className="post-grid">
          {visible.map((card) => renderCard(card))}
        </div>
      </section>
    </>
  );
}

function renderCard(card: GridCard) {
  if (card.kind === "sample") {
    return <BlogPostCard key={card.post.id} sample={card.post} />;
  }
  return <BlogPostCard key={card.post.slug} post={card.post} />;
}
