import { PublicPostView } from "@/components/public/post-view";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function PublicPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
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
    <PublicPostView
      post={{
        title: post.title,
        slug: post.slug,
        my_take: post.my_take,
        body: post.body,
        published_at: post.published_at,
        body_language: post.body_language,
      }}
      sources={(ordered as { author: string | null; title: string | null; url: string; platform: string }[]) ?? []}
    />
  );
}
