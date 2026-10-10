import { BlogIndexClient } from "@/components/blog/blog-index-client";
import { Suspense } from "react";
import { BlogNewsletter } from "@/components/blog/blog-newsletter";
import { BlogServices } from "@/components/blog/blog-services";
import { sortPostsNewest } from "@/lib/blog/queries";
import type { PublicBlogPost } from "@/lib/blog/types";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PublicBlogIndexPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("studio_posts")
    .select(
      "id, title, slug, seo_title, meta_description, excerpt, my_take, body, body_language, published_at, category, read_time, cover_url, key_points",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const posts = sortPostsNewest((rows ?? []) as PublicBlogPost[]);

  return (
    <>
      <Suspense fallback={<p className="muted">Loading posts…</p>}>
        <BlogIndexClient posts={posts} />
      </Suspense>
      <BlogServices />
      <BlogNewsletter />
    </>
  );
}
