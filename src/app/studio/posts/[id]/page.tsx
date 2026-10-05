import { PostEditor } from "@/components/studio/post-editor";
import type { PostVariantRecord } from "@/lib/studio/channels";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function StudioPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase.from("studio_posts").select("*").eq("id", id).single();
  if (!post) notFound();

  const { data: links } = await supabase
    .from("studio_post_sources")
    .select("source_id, position")
    .eq("post_id", id)
    .order("position");

  const sourceIds = (links ?? []).map((l) => l.source_id);
  const { data: sources } = sourceIds.length
    ? await supabase.from("studio_sources").select("*").in("id", sourceIds)
    : { data: [] };

  const orderedSources = (links ?? [])
    .map((l) => (sources ?? []).find((s) => s.id === l.source_id))
    .filter(Boolean);

  const { data: suggestions } = await supabase
    .from("studio_suggestions")
    .select("id, paragraph, source_id, label, channel")
    .eq("post_id", id)
    .eq("status", "pending");

  const { data: comments } = await supabase
    .from("studio_post_comments")
    .select("id, body, resolved, created_at")
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  const { data: variantRows } = await supabase
    .from("studio_post_variants")
    .select("channel, content, extra")
    .eq("post_id", id);

  const variants: Partial<Record<"x" | "threads" | "zh" | "en", PostVariantRecord>> = {};
  for (const row of variantRows ?? []) {
    const ch = row.channel as "x" | "threads" | "zh" | "en";
    variants[ch] = {
      channel: ch,
      content: row.content as string,
      extra: (row.extra as PostVariantRecord["extra"]) ?? {},
    };
  }

  const { data: versions } = await supabase
    .from("studio_post_versions")
    .select("id, created_at, title")
    .eq("post_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <PostEditor
      post={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        status: post.status,
        my_take: post.my_take,
        body: post.body,
        body_language: post.body_language,
        key_point: post.key_point,
        social_title: post.social_title ?? null,
        social_captions: post.social_captions,
        kit_broadcast_id: post.kit_broadcast_id,
        seo_title: post.seo_title ?? null,
        meta_description: post.meta_description ?? null,
      }}
      sources={(orderedSources ?? []).map((s) => ({
        id: s!.id,
        author: s!.author,
        title: s!.title,
        url: s!.url,
        platform: s!.platform,
        full_text: s!.full_text,
        text_content: s!.text_content,
        summary_en: s!.summary_en,
        summary_zh: s!.summary_zh,
      }))}
      suggestions={(suggestions ?? []).map((s) => ({
        id: s.id,
        paragraph: s.paragraph,
        source_id: s.source_id,
        label: s.label ?? undefined,
        channel: (s.channel as import("@/lib/studio/channels").SuggestionChannel) ?? "blog",
      }))}
      comments={comments ?? []}
      variants={variants}
      versions={versions ?? []}
    />
  );
}
