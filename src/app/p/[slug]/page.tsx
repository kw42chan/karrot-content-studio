import { PublicPostView } from "@/components/public/post-view";
import { isDraftPlaceholderSlug } from "@/lib/posts/site-publish";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (isDraftPlaceholderSlug(slug)) return { title: "Not found" };

  const supabase = await createClient();
  const { data: post } = await supabase
    .from("studio_posts")
    .select("seo_title, title, meta_description")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!post) return { title: "Not found" };

  return {
    title: post.seo_title || post.title,
    description: post.meta_description ?? undefined,
  };
}

export default async function PublicSitePostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (isDraftPlaceholderSlug(slug)) notFound();

  const supabase = await createClient();
  const { data: post } = await supabase
    .from("studio_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!post) notFound();

  const { data: links } = await supabase
    .from("studio_post_sources")
    .select("source_id, position")
    .eq("post_id", post.id)
    .order("position");

  const ids = (links ?? []).map((l) => l.source_id);
  const { data: sources } = ids.length
    ? await supabase.from("studio_sources").select("id, author, title, url, platform").in("id", ids)
    : { data: [] };

  const byId = new Map((sources ?? []).map((s) => [s.id, s]));
  const ordered = (links ?? []).map((l) => byId.get(l.source_id)).filter(Boolean);

  return (
    <div className="min-h-screen bg-[var(--karrot-bg)]">
      <PublicPostView
        post={{
          title: post.seo_title || post.title,
          slug: post.slug,
          my_take: post.my_take,
          body: post.body,
          published_at: post.published_at,
          body_language: post.body_language,
        }}
        sources={(ordered as { author: string | null; title: string | null; url: string; platform: string }[]) ?? []}
        backHref="/p"
      />
    </div>
  );
}
