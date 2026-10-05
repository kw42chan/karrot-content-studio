"use server";

import { revalidatePath } from "next/cache";
import { draftPostBody, suggestEnrichmentParagraph, summarizeSource } from "@/lib/ai/openrouter";
import { publishToKit, type KitPublishMode } from "@/lib/kit/client";
import { renderKitPostHtml } from "@/lib/kit/render-post-html";
import {
  appendSourcesToBody,
  buildSourcesMarkdown,
  type SourceCredit,
} from "@/lib/posts/build-sources-markdown";
import { slugify } from "@/lib/posts/slugify";
import { readSourceFromUrl } from "@/lib/sources/read-source";
import type { BilingualSummary } from "@/lib/sources/types";
import { createClient } from "@/lib/supabase/server";
import { getAdminEmail } from "@/lib/env";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || user.email.toLowerCase() !== getAdminEmail().toLowerCase()) {
    throw new Error("Unauthorized");
  }
  return supabase;
}

export async function addSourceToPost(postId: string, rawUrl: string) {
  const supabase = await requireAdmin();
  const { normalizedUrl, platform, result } = await readSourceFromUrl(rawUrl);

  const { data: existing } = await supabase
    .from("studio_sources")
    .select("*")
    .eq("url_normalized", normalizedUrl)
    .maybeSingle();

  let sourceId = existing?.id as string | undefined;
  let summaryEn = existing?.summary_en as BilingualSummary["en"] | null;
  let summaryZh = existing?.summary_zh as BilingualSummary["zh"] | null;

  if (!existing) {
    const bilingual = await summarizeSource(normalizedUrl, result.text, result.title);
    const { data: inserted, error } = await supabase
      .from("studio_sources")
      .insert({
        url: result.url,
        url_normalized: normalizedUrl,
        platform,
        title: result.title,
        author: result.author,
        text_content: result.text,
        published_at: result.published_at,
        full_text: result.full_text,
        summary_en: bilingual.en,
        summary_zh: bilingual.zh,
      })
      .select("id, summary_en, summary_zh")
      .single();
    if (error) throw new Error(error.message);
    sourceId = inserted.id;
    summaryEn = inserted.summary_en;
    summaryZh = inserted.summary_zh;
  }

  const { data: linkExists } = await supabase
    .from("studio_post_sources")
    .select("post_id")
    .eq("post_id", postId)
    .eq("source_id", sourceId!)
    .maybeSingle();

  const isNewLink = !linkExists;

  if (isNewLink) {
    const { count } = await supabase
      .from("studio_post_sources")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);
    await supabase.from("studio_post_sources").insert({
      post_id: postId,
      source_id: sourceId!,
      position: count ?? 0,
    });
  }

  const { data: post } = await supabase
    .from("studio_posts")
    .select("title, body, body_language")
    .eq("id", postId)
    .single();

  if (isNewLink && post && summaryEn) {
    const paragraph = await suggestEnrichmentParagraph({
      postTitle: post.title,
      existingBody: post.body,
      newSourceSummary:
        post.body_language === "zh-HK"
          ? JSON.stringify(summaryZh)
          : JSON.stringify(summaryEn),
      language: post.body_language as "zh-HK" | "en",
    });
    await supabase.from("studio_suggestions").insert({
      post_id: postId,
      source_id: sourceId!,
      paragraph,
      status: "pending",
    });
  }

  revalidatePath(`/studio/posts/${postId}`);
  return { sourceId, reused: !!existing };
}

export async function createPost() {
  const supabase = await requireAdmin();
  const slug = `draft-${Date.now()}`;
  const { data, error } = await supabase
    .from("studio_posts")
    .insert({ title: "Untitled draft", slug, status: "draft" })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/studio");
  return data.id as string;
}

export async function savePost(input: {
  id: string;
  title: string;
  slug: string;
  my_take: string;
  body: string;
  body_language: "zh-HK" | "en";
  status: "draft" | "published";
  key_point?: string;
  social_captions?: { zh?: string; en?: string };
}) {
  const supabase = await requireAdmin();

  const sources = await loadPostSources(supabase, input.id);
  const sourcesMd = buildSourcesMarkdown(sources);
  const bodyWithSources = appendSourcesToBody(input.body, sourcesMd);

  const { error } = await supabase
    .from("studio_posts")
    .update({
      title: input.title,
      slug: input.slug || slugify(input.title),
      my_take: input.my_take,
      body: bodyWithSources,
      body_language: input.body_language,
      status: input.status,
      key_point: input.key_point,
      social_captions: input.social_captions,
      published_at: input.status === "published" ? new Date().toISOString() : null,
    })
    .eq("id", input.id);

  if (error) throw new Error(error.message);

  await supabase.from("studio_post_versions").insert({
    post_id: input.id,
    title: input.title,
    my_take: input.my_take,
    body: bodyWithSources,
    body_language: input.body_language,
  });

  revalidatePath(`/studio/posts/${input.id}`);
  revalidatePath("/posts");
}

export async function draftPostWithAi(postId: string) {
  const supabase = await requireAdmin();
  const { data: post } = await supabase.from("studio_posts").select("*").eq("id", postId).single();
  if (!post) throw new Error("Post not found");

  const sources = await loadPostSources(supabase, postId);
  if (!sources.length) throw new Error("Attach at least one source first");

  const summaries = await Promise.all(
    sources.map(async (s) => {
      const { data: row } = await supabase
        .from("studio_sources")
        .select("summary_en, summary_zh")
        .eq("id", s.id)
        .single();
      return {
        author: s.author,
        title: s.title,
        url: s.url,
        summaryEn: (row?.summary_en as { summary?: string })?.summary ?? "",
        summaryZh: (row?.summary_zh as { summary?: string })?.summary ?? "",
      };
    }),
  );

  const drafted = await draftPostBody({
    title: post.title,
    language: post.body_language as "zh-HK" | "en",
    myTake: post.my_take,
    sources: summaries,
  });

  const sourcesMd = buildSourcesMarkdown(sources);
  const body = appendSourcesToBody(drafted.body, sourcesMd);

  await supabase
    .from("studio_posts")
    .update({
      body,
      key_point: drafted.keyPoint,
      social_captions: drafted.socialCaptions,
    })
    .eq("id", postId);

  await supabase.from("studio_post_versions").insert({
    post_id: postId,
    title: post.title,
    my_take: post.my_take,
    body,
    body_language: post.body_language,
  });

  revalidatePath(`/studio/posts/${postId}`);
}

export async function resolveSuggestion(
  suggestionId: string,
  action: "accept" | "dismiss",
  editedText?: string,
) {
  const supabase = await requireAdmin();
  const { data: sug } = await supabase
    .from("studio_suggestions")
    .select("*")
    .eq("id", suggestionId)
    .single();
  if (!sug) throw new Error("Suggestion not found");

  if (action === "dismiss") {
    await supabase
      .from("studio_suggestions")
      .update({ status: "dismissed" })
      .eq("id", suggestionId);
    revalidatePath(`/studio/posts/${sug.post_id}`);
    return;
  }

  const { data: post } = await supabase
    .from("studio_posts")
    .select("body, my_take, title, body_language")
    .eq("id", sug.post_id)
    .single();
  if (!post) throw new Error("Post missing");

  const paragraph = editedText ?? sug.paragraph;
  const marker = "## Sources";
  let newBody = post.body;
  if (newBody.includes(marker)) {
    newBody = newBody.replace(marker, `${paragraph}\n\n${marker}`);
  } else {
    newBody = `${newBody.trim()}\n\n${paragraph}`;
  }

  await supabase
    .from("studio_posts")
    .update({ body: newBody })
    .eq("id", sug.post_id);
  await supabase
    .from("studio_suggestions")
    .update({ status: editedText ? "edited" : "accepted" })
    .eq("id", suggestionId);

  await supabase.from("studio_post_versions").insert({
    post_id: sug.post_id,
    title: post.title,
    my_take: post.my_take,
    body: newBody,
    body_language: post.body_language,
  });

  revalidatePath(`/studio/posts/${sug.post_id}`);
}

export async function publishPostToKit(
  postId: string,
  mode: KitPublishMode,
  confirmEmail: boolean,
) {
  const supabase = await requireAdmin();
  const { data: post } = await supabase.from("studio_posts").select("*").eq("id", postId).single();
  if (!post) throw new Error("Post not found");

  const sources = await loadPostSources(supabase, postId);
  const html = renderKitPostHtml({
    title: post.title,
    myTake: post.my_take,
    bodyMarkdown: stripSourcesSection(post.body),
    sources,
  });

  const { broadcastId } = await publishToKit({
    subject: post.title,
    contentHtml: html,
    broadcastId: post.kit_broadcast_id,
    mode,
    confirmEmail,
  });

  await supabase
    .from("studio_posts")
    .update({
      kit_broadcast_id: broadcastId,
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", postId);

  revalidatePath(`/studio/posts/${postId}`);
  revalidatePath("/posts");
  return broadcastId;
}

export async function restoreVersion(versionId: string) {
  const supabase = await requireAdmin();
  const { data: version } = await supabase
    .from("studio_post_versions")
    .select("*")
    .eq("id", versionId)
    .single();
  if (!version) throw new Error("Version not found");

  await supabase
    .from("studio_posts")
    .update({
      title: version.title,
      my_take: version.my_take,
      body: version.body,
      body_language: version.body_language,
    })
    .eq("id", version.post_id);

  revalidatePath(`/studio/posts/${version.post_id}`);
}

async function loadPostSources(
  supabase: Awaited<ReturnType<typeof createClient>>,
  postId: string,
): Promise<(SourceCredit & { id: string })[]> {
  const { data: links } = await supabase
    .from("studio_post_sources")
    .select("source_id, position")
    .eq("post_id", postId)
    .order("position");

  if (!links?.length) return [];

  const ids = links.map((l) => l.source_id);
  const { data: sources } = await supabase.from("studio_sources").select("*").in("id", ids);
  const byId = new Map((sources ?? []).map((s) => [s.id, s]));

  return links
    .map((l) => {
      const s = byId.get(l.source_id);
      if (!s) return null;
      return {
        id: s.id as string,
        author: s.author as string | null,
        title: s.title as string | null,
        url: s.url as string,
        platform: s.platform as string,
      };
    })
    .filter(Boolean) as (SourceCredit & { id: string })[];
}

function stripSourcesSection(body: string): string {
  return body.replace(/\n## Sources[\s\S]*$/m, "").trim();
}
