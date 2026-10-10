import { BlogArticle } from "@/components/blog/blog-article";
import { BlogNewsletter } from "@/components/blog/blog-newsletter";
import { BlogPostCard } from "@/components/blog/blog-post-card";
import { BlogRail } from "@/components/blog/blog-rail";
import { BlogServices } from "@/components/blog/blog-services";
import { categoryLabel } from "@/lib/blog/categories";
import {
  adjacentPosts,
  buildMoreInCategory,
  sortPostsNewest,
} from "@/lib/blog/queries";
import { filterPublicPosts } from "@/lib/blog/public-posts";
import { postDisplayTitle } from "@/lib/blog/format";
import type { PublicBlogPost } from "@/lib/blog/types";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const POST_SELECT =
  "id, title, slug, seo_title, meta_description, excerpt, my_take, body, body_language, published_at, category, read_time, cover_url, key_points";

async function loadPublishedPosts() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("studio_posts")
    .select(POST_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false });
  return filterPublicPosts(sortPostsNewest((data ?? []) as PublicBlogPost[]));
}

async function loadPost(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("studio_posts")
    .select(POST_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data as PublicBlogPost | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) return { title: "Not found" };
  const title = postDisplayTitle(post);
  return {
    title,
    description: post.meta_description || post.excerpt || undefined,
  };
}

export default async function PublicBlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) notFound();

  const all = await loadPublishedPosts();
  const related = buildMoreInCategory(all, post);
  const { prev, next } = adjacentPosts(all, slug);
  const catLabel = post.category ? categoryLabel(post.category) : "Posts";

  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb" lang="en">
        <Link href="/p">Posts</Link>
        <span className="sep">/</span>
        {post.category ? (
          <Link className="current" href={`/p?category=${post.category}`}>{catLabel}</Link>
        ) : (
          <span className="current">{catLabel}</span>
        )}
      </nav>

      <div className="post-layout">
        <main>
          <BlogArticle post={post} />
        </main>
        <BlogRail posts={all} activeCategory={post.category} />
      </div>

      {related.length > 0 && (
        <section className="section" lang="en" aria-labelledby="relTitle">
          <div className="related-head">
            <div>
              <div className="eyebrow">Keep reading</div>
              <h2 className="h-anton" id="relTitle">
                More in {catLabel}
              </h2>
            </div>
          </div>
          <div className="post-grid">
            {related.map((card) => (
              <BlogPostCard
                key={card.post.slug}
                post={card.post}
                previousLabel={card.previous}
              />
            ))}
          </div>
          <div className="prevnext">
            {prev ? (
              <Link className="pn" href={`/p/${prev.slug}`}>
                <small>← Previous post</small>
                <span className="h-anton">{postDisplayTitle(prev)}</span>
              </Link>
            ) : (
              <div className="pn disabled">
                <small>← Previous post</small>
                <span>You&apos;re at the oldest post</span>
              </div>
            )}
            {next ? (
              <Link className="pn next" href={`/p/${next.slug}`}>
                <small>Next post →</small>
                <span className="h-anton">{postDisplayTitle(next)}</span>
              </Link>
            ) : (
              <div className="pn next disabled">
                <small>Next post →</small>
                <span>You&apos;re reading the latest post</span>
              </div>
            )}
          </div>
        </section>
      )}

      <BlogServices variant="strip" />
      <BlogNewsletter />
    </>
  );
}
