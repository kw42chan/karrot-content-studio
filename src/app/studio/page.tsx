import { PostsListPage } from "@/components/studio/posts-list-page";
import type { StudioListPost } from "@/components/studio/posts-list";
import { publicDisplayTitle } from "@/lib/blog/public-posts";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function channelsFromVariants(
  rows: { channel: string; content: string }[] | null,
): StudioListPost["channels"] {
  const ch: StudioListPost["channels"] = ["blog"];
  for (const row of rows ?? []) {
    if (row.channel === "x" && row.content.trim()) ch.push("x");
    if (row.channel === "threads" && row.content.trim()) ch.push("threads");
    if ((row.channel === "zh" || row.channel === "en") && row.content.trim()) {
      if (!ch.includes("instagram")) ch.push("instagram");
    }
  }
  return ch;
}

export default async function StudioHomePage() {
  const supabase = await createClient();
  await supabase.auth.getUser();
  const { data: posts, error: postsError } = await supabase
    .from("studio_posts")
    .select("id, title, slug, seo_title, status, updated_at, my_take")
    .order("updated_at", { ascending: false });

  if (postsError) {
    console.error("[studio] posts list query failed:", postsError.message);
  }

  const ids = (posts ?? []).map((p) => p.id);
  const { data: variantRows } = ids.length
    ? await supabase.from("studio_post_variants").select("post_id, channel, content").in("post_id", ids)
    : { data: [] };

  const variantsByPost = new Map<string, { channel: string; content: string }[]>();
  for (const row of variantRows ?? []) {
    const list = variantsByPost.get(row.post_id) ?? [];
    list.push({ channel: row.channel as string, content: row.content as string });
    variantsByPost.set(row.post_id, list);
  }

  const listPosts: StudioListPost[] = (posts ?? []).map((p) => ({
    id: p.id,
    title: publicDisplayTitle({
      title: p.title,
      slug: p.slug,
      seo_title: p.seo_title as string | null,
    }),
    slug: p.slug,
    searchText: [p.title, p.seo_title, p.slug, p.my_take].filter(Boolean).join(" "),
    status: p.status as "draft" | "published",
    updated_at: p.updated_at,
    channels: channelsFromVariants(variantsByPost.get(p.id) ?? null),
    subtitle: p.my_take ? p.my_take.slice(0, 80) : undefined,
  }));

  return (
    <div className="studio-list-page">
      <PostsListPage posts={listPosts} />
    </div>
  );
}
