"use server";

import { revalidatePath } from "next/cache";
import {
  adjustBlogBody,
  draftPostBody,
  reviseDraftFromComments,
  suggestEnrichmentParagraph,
  summarizeSource,
} from "@/lib/ai/openrouter";
import {
  adjustVariantContent,
  draftVariantFromSources,
  generateVariantFromBlog,
  reviseVariantFromComments,
} from "@/lib/ai/variant-draft";
import type { SuggestionChannel, VariantExtra } from "@/lib/studio/channels";
import {
  normalizeGenerationPrefs,
  type PostGenerationPrefs,
} from "@/lib/studio/generation-prefs";
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

export type SavePostResult = { ok: true } | { ok: false; error: string };

export type PublishPostResult =
  | { ok: true; broadcastId: string }
  | { ok: false; error: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || user.email.toLowerCase() !== getAdminEmail().toLowerCase()) {
    throw new Error(`Unauthorized — signed in as ${user?.email ?? "nobody"}, expected ${getAdminEmail()}`);
  }
  return supabase;
}

async function upsertSourceFromRead(
  supabase: Awaited<ReturnType<typeof createClient>>,
  normalizedUrl: string,
  platform: "x" | "threads" | "web",
  result: Awaited<ReturnType<typeof readSourceFromUrl>>["result"],
  existingId?: string,
) {
  const bilingual = await summarizeSource(normalizedUrl, result.text, result.title);
  const row = {
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
  };

  if (existingId) {
    const { data, error } = await supabase
      .from("studio_sources")
      .update(row)
      .eq("id", existingId)
      .select("id, summary_en, summary_zh")
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  const { data: inserted, error } = await supabase
    .from("studio_sources")
    .insert(row)
    .select("id, summary_en, summary_zh")
    .single();
  if (error) throw new Error(error.message);
  return inserted;
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

  const shouldRefresh =
    existing &&
    platform === "web" &&
    (!existing.full_text ||
      (existing.text_content as string)?.length < result.text.length * 0.8);

  if (!existing || shouldRefresh) {
    const saved = await upsertSourceFromRead(
      supabase,
      normalizedUrl,
      platform,
      result,
      shouldRefresh ? existing!.id : undefined,
    );
    sourceId = saved.id;
    summaryEn = saved.summary_en as BilingualSummary["en"];
    summaryZh = saved.summary_zh as BilingualSummary["zh"];
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
    const { error: linkErr } = await supabase.from("studio_post_sources").insert({
      post_id: postId,
      source_id: sourceId!,
      position: count ?? 0,
    });
    if (linkErr) throw new Error(linkErr.message);
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
      label: "Suggested from a new source",
      channel: "blog",
    });
  }

  revalidatePath(`/studio/posts/${postId}`);
  return { sourceId, reused: !!existing && !shouldRefresh };
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
  social_title?: string;
  social_captions?: { zh?: string; en?: string };
  seo_title?: string;
  meta_description?: string;
}): Promise<SavePostResult> {
  try {
    const supabase = await requireAdmin();

    const sources = await loadPostSources(supabase, input.id);
    const sourcesMd = buildSourcesMarkdown(sources);
    const bodyWithSources = appendSourcesToBody(input.body, sourcesMd);

    const payload = {
      title: input.title,
      slug: input.slug || slugify(input.title),
      my_take: input.my_take,
      body: bodyWithSources,
      body_language: input.body_language,
      status: input.status,
      key_point: input.key_point ?? null,
      social_title: input.social_title ?? null,
      social_captions: input.social_captions ?? null,
      seo_title: input.seo_title ?? null,
      meta_description: input.meta_description ?? null,
      published_at: input.status === "published" ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase
      .from("studio_posts")
      .update(payload)
      .eq("id", input.id)
      .select("id")
      .single();

    if (error) {
      return { ok: false, error: `Save failed: ${error.message} (${error.code ?? "unknown"})` };
    }
    if (!data) {
      return {
        ok: false,
        error:
          "Save failed: no row updated. Check you are signed in as the admin email and RLS policies are applied.",
      };
    }

    const { error: versionErr } = await supabase.from("studio_post_versions").insert({
      post_id: input.id,
      title: input.title,
      my_take: input.my_take,
      body: bodyWithSources,
      body_language: input.body_language,
    });
    if (versionErr) {
      return { ok: false, error: `Saved post but version history failed: ${versionErr.message}` };
    }

    revalidatePath(`/studio/posts/${input.id}`);
    revalidatePath("/posts");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Save failed" };
  }
}

export async function addPostComment(postId: string, body: string) {
  const supabase = await requireAdmin();
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Comment cannot be empty");

  const { data, error } = await supabase
    .from("studio_post_comments")
    .insert({ post_id: postId, body: trimmed })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(`/studio/posts/${postId}`);
  return data.id as string;
}

export async function resolvePostComment(commentId: string) {
  const supabase = await requireAdmin();
  const { data, error } = await supabase
    .from("studio_post_comments")
    .update({ resolved: true })
    .eq("id", commentId)
    .select("post_id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(`/studio/posts/${data.post_id}`);
}

export async function saveVariant(input: {
  postId: string;
  channel: "x" | "threads" | "zh" | "en";
  content: string;
  extra?: VariantExtra;
}): Promise<SavePostResult> {
  try {
    const supabase = await requireAdmin();
    const extra = input.extra ?? {};

    const { data, error } = await supabase
      .from("studio_post_variants")
      .upsert(
        {
          post_id: input.postId,
          channel: input.channel,
          content: input.content,
          extra,
        },
        { onConflict: "post_id,channel" },
      )
      .select("post_id")
      .single();

    if (error) return { ok: false, error: `Save failed: ${error.message}` };
    if (!data) return { ok: false, error: "Save failed: no row updated (check RLS)." };

    await supabase.from("studio_post_variant_versions").insert({
      post_id: input.postId,
      channel: input.channel,
      content: input.content,
      extra,
    });

    if (input.channel === "zh" || input.channel === "en") {
      const { data: post } = await supabase
        .from("studio_posts")
        .select("social_captions")
        .eq("id", input.postId)
        .single();
      const caps = (post?.social_captions as { zh?: string; en?: string }) ?? {};
      await supabase
        .from("studio_posts")
        .update({
          social_captions: {
            ...caps,
            [input.channel === "zh" ? "zh" : "en"]: input.content,
          },
          ...(extra.social_title ? { social_title: extra.social_title } : {}),
          ...(extra.key_point ? { key_point: extra.key_point } : {}),
        })
        .eq("id", input.postId);
    }

    revalidatePath(`/studio/posts/${input.postId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Save failed" };
  }
}

export async function applyPostComments(postId: string, channel: SuggestionChannel) {
  const supabase = await requireAdmin();
  const { data: comments } = await supabase
    .from("studio_post_comments")
    .select("id, body")
    .eq("post_id", postId)
    .eq("resolved", false)
    .order("created_at");

  if (!comments?.length) throw new Error("No open comments to apply");

  const { data: post } = await supabase
    .from("studio_posts")
    .select("title, body, body_language")
    .eq("id", postId)
    .single();
  if (!post) throw new Error("Post not found");

  const lang = post.body_language as "zh-HK" | "en";
  let paragraph: string;

  if (channel === "blog") {
    paragraph = await reviseDraftFromComments({
      postTitle: post.title as string,
      language: lang,
      draftBody: stripSourcesSection(post.body as string),
      comments: comments.map((c) => c.body as string),
    });
  } else {
    const { data: variant } = await supabase
      .from("studio_post_variants")
      .select("content")
      .eq("post_id", postId)
      .eq("channel", channel)
      .maybeSingle();
    paragraph = await reviseVariantFromComments({
      channel,
      postTitle: post.title as string,
      language: lang,
      currentContent: (variant?.content as string) ?? "",
      comments: comments.map((c) => c.body as string),
    });
  }

  const { error: sugErr } = await supabase.from("studio_suggestions").insert({
    post_id: postId,
    source_id: null,
    paragraph,
    status: "pending",
    label: "Suggested from your comments",
    channel,
  });
  if (sugErr) throw new Error(sugErr.message);

  const ids = comments.map((c) => c.id);
  await supabase.from("studio_post_comments").update({ resolved: true }).in("id", ids);

  revalidatePath(`/studio/posts/${postId}`);
}

export async function saveGenerationPrefs(postId: string, prefs: PostGenerationPrefs) {
  const supabase = await requireAdmin();
  const { data: post } = await supabase
    .from("studio_posts")
    .select("generation_prefs")
    .eq("id", postId)
    .single();
  if (!post) throw new Error("Post not found");

  const merged = normalizeGenerationPrefs({
    ...(post.generation_prefs as object),
    ...prefs,
  });

  const { error } = await supabase
    .from("studio_posts")
    .update({ generation_prefs: merged })
    .eq("id", postId);
  if (error) throw new Error(error.message);
  revalidatePath(`/studio/posts/${postId}`);
}

export async function draftPostWithAi(
  postId: string,
  channel: SuggestionChannel,
  prefsInput?: PostGenerationPrefs,
) {
  const supabase = await requireAdmin();
  const { data: post } = await supabase.from("studio_posts").select("*").eq("id", postId).single();
  if (!post) throw new Error("Post not found");

  const prefs = normalizeGenerationPrefs(prefsInput ?? post.generation_prefs);
  await saveGenerationPrefs(postId, prefs);

  const sources = await loadPostSources(supabase, postId);
  if (!sources.length) throw new Error("Attach at least one source first");

  const bundles = await loadSourceBundles(supabase, sources);

  if (channel === "blog") {
    const drafted = await draftPostBody({
      title: post.title,
      language: post.body_language as "zh-HK" | "en",
      myTake: post.my_take,
      length: prefs.blog.length,
      coverage: prefs.blog.coverage,
      sources: bundles,
    });

    const { error: sugErr } = await supabase.from("studio_suggestions").insert({
      post_id: postId,
      source_id: null,
      paragraph: drafted.body,
      status: "pending",
      label: "Draft from sources",
      channel: "blog",
      extra: {
        key_point: drafted.keyPoint,
        social_captions: drafted.socialCaptions,
      },
    });
    if (sugErr) throw new Error(sugErr.message);
  } else {
    const { data: existing } = await supabase
      .from("studio_post_variants")
      .select("content")
      .eq("post_id", postId)
      .eq("channel", channel)
      .maybeSingle();

    const drafted = await draftVariantFromSources({
      channel,
      postTitle: post.title,
      language: post.body_language as "zh-HK" | "en",
      sources: bundles,
      currentContent: existing?.content as string | undefined,
      prefs,
    });

    const { error: sugErr } = await supabase.from("studio_suggestions").insert({
      post_id: postId,
      source_id: null,
      paragraph: drafted.content,
      status: "pending",
      label: "Draft from sources",
      channel,
      extra: drafted.extra ?? {},
    });
    if (sugErr) throw new Error(sugErr.message);
  }

  revalidatePath(`/studio/posts/${postId}`);
}

export async function generateVariantFromBlogAction(
  postId: string,
  channel: SuggestionChannel,
  prefsInput?: PostGenerationPrefs,
) {
  if (channel === "blog") throw new Error("Use blog tab only");
  const supabase = await requireAdmin();
  const { data: post } = await supabase.from("studio_posts").select("*").eq("id", postId).single();
  if (!post) throw new Error("Post not found");

  const prefs = normalizeGenerationPrefs(prefsInput ?? post.generation_prefs);
  await saveGenerationPrefs(postId, prefs);

  const generated = await generateVariantFromBlog({
    channel,
    postTitle: post.title,
    blogBody: stripSourcesSection(post.body as string),
    language: post.body_language as "zh-HK" | "en",
    prefs,
  });

  const { error: sugErr } = await supabase.from("studio_suggestions").insert({
    post_id: postId,
    source_id: null,
    paragraph: generated.content,
    status: "pending",
    label: "Generated from blog",
    channel,
    extra: generated.extra ?? {},
  });
  if (sugErr) throw new Error(sugErr.message);
  revalidatePath(`/studio/posts/${postId}`);
}

export async function quickAdjustVariantAction(
  postId: string,
  channel: SuggestionChannel,
  adjust: "shorter" | "longer" | "more_detail",
  prefsInput?: PostGenerationPrefs,
) {
  const supabase = await requireAdmin();
  const { data: post } = await supabase.from("studio_posts").select("*").eq("id", postId).single();
  if (!post) throw new Error("Post not found");

  const prefs = normalizeGenerationPrefs(prefsInput ?? post.generation_prefs);
  const language = post.body_language as "zh-HK" | "en";
  const sources = await loadPostSources(supabase, postId);
  const bundles = await loadSourceBundles(supabase, sources);

  const label =
    adjust === "shorter"
      ? "Make shorter"
      : adjust === "longer"
        ? "Make longer"
        : "Add more detail from sources";

  if (channel === "blog") {
    const body = stripSourcesSection(post.body as string);
    if (!body.trim()) throw new Error("Write or draft blog content first");
    const revised = await adjustBlogBody({
      title: post.title,
      language,
      currentBody: body,
      adjust,
      sources: adjust === "more_detail" ? bundles : undefined,
    });
    const { error: sugErr } = await supabase.from("studio_suggestions").insert({
      post_id: postId,
      source_id: null,
      paragraph: revised,
      status: "pending",
      label,
      channel: "blog",
    });
    if (sugErr) throw new Error(sugErr.message);
  } else {
    const { data: existing } = await supabase
      .from("studio_post_variants")
      .select("content, extra")
      .eq("post_id", postId)
      .eq("channel", channel)
      .maybeSingle();

    const content = (existing?.content as string) ?? "";
    if (!content.trim()) throw new Error("No content to adjust — generate or draft first");

    const adjusted = await adjustVariantContent({
      channel,
      adjust,
      postTitle: post.title,
      language,
      currentContent: content,
      currentExtra: (existing?.extra as Record<string, unknown>) ?? {},
      sources: adjust === "more_detail" ? bundles : undefined,
      prefs,
    });

    const { error: sugErr } = await supabase.from("studio_suggestions").insert({
      post_id: postId,
      source_id: null,
      paragraph: adjusted.content,
      status: "pending",
      label,
      channel,
      extra: adjusted.extra ?? {},
    });
    if (sugErr) throw new Error(sugErr.message);
  }

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

  const paragraph = editedText ?? (sug.paragraph as string);
  const channel = (sug.channel as SuggestionChannel) ?? "blog";
  const extra = (sug.extra as VariantExtra & { social_captions?: { zh?: string; en?: string } }) ?? {};

  if (channel === "blog") {
    const sources = await loadPostSources(supabase, sug.post_id as string);
    const sourcesMd = buildSourcesMarkdown(sources);
    const marker = "## Sources";
    let newBody: string;
    const fullBodyReplace =
      sug.label === "Draft from sources" ||
      sug.label === "Make shorter" ||
      sug.label === "Make longer" ||
      sug.label === "Add more detail from sources";

    if (fullBodyReplace) {
      newBody = appendSourcesToBody(paragraph, sourcesMd);
    } else if ((post.body as string).includes(marker)) {
      newBody = (post.body as string).replace(marker, `${paragraph}\n\n${marker}`);
    } else {
      newBody = `${(post.body as string).trim()}\n\n${paragraph}`;
    }

    const postUpdate: Record<string, unknown> = { body: newBody };
    if (extra.key_point) postUpdate.key_point = extra.key_point;
    if (extra.social_captions) postUpdate.social_captions = extra.social_captions;

    const { error: upErr } = await supabase
      .from("studio_posts")
      .update(postUpdate)
      .eq("id", sug.post_id)
      .select("id")
      .single();
    if (upErr) throw new Error(upErr.message);

    await supabase.from("studio_post_versions").insert({
      post_id: sug.post_id,
      title: post.title,
      my_take: post.my_take,
      body: newBody,
      body_language: post.body_language,
    });
  } else {
    const variantExtra: VariantExtra = {
      ...(extra.thread_parts ? { thread_parts: extra.thread_parts } : {}),
      ...(extra.social_title ? { social_title: extra.social_title } : {}),
      ...(extra.key_point ? { key_point: extra.key_point } : {}),
    };

    const { error: vErr } = await supabase
      .from("studio_post_variants")
      .upsert(
        {
          post_id: sug.post_id,
          channel,
          content: paragraph,
          extra: variantExtra,
        },
        { onConflict: "post_id,channel" },
      )
      .select("post_id")
      .single();
    if (vErr) throw new Error(vErr.message);

    await supabase.from("studio_post_variant_versions").insert({
      post_id: sug.post_id,
      channel,
      content: paragraph,
      extra: variantExtra,
    });
  }

  await supabase
    .from("studio_suggestions")
    .update({ status: editedText ? "edited" : "accepted" })
    .eq("id", suggestionId);

  revalidatePath(`/studio/posts/${sug.post_id}`);
}

export async function publishPostToKit(
  postId: string,
  mode: KitPublishMode,
  confirmEmail: boolean,
): Promise<PublishPostResult> {
  try {
    const supabase = await requireAdmin();
    const { data: post } = await supabase.from("studio_posts").select("*").eq("id", postId).single();
    if (!post) {
      return { ok: false, error: "Post not found." };
    }

    if (!post.slug?.trim()) {
      return { ok: false, error: "Publish failed: add a URL slug in Blog settings." };
    }

    const bodyMarkdown = stripSourcesSection(post.body as string);
    if (!bodyMarkdown.trim()) {
      return { ok: false, error: "Publish failed: post body is empty." };
    }

    const sources = await loadPostSources(supabase, postId);
    const html = renderKitPostHtml({
      title: post.title,
      myTake: post.my_take,
      bodyMarkdown,
      sources,
    });

    const kit = await publishToKit({
      subject: post.title,
      contentHtml: html,
      broadcastId: post.kit_broadcast_id,
      mode,
      confirmEmail,
    });

    if (!kit.ok) {
      return { ok: false, error: kit.error };
    }

    const { error: updateErr } = await supabase
      .from("studio_posts")
      .update({
        kit_broadcast_id: kit.broadcastId,
        status: "published",
        published_at: new Date().toISOString(),
      })
      .eq("id", postId);

    if (updateErr) {
      return { ok: false, error: `Published to Kit but could not save post: ${updateErr.message}` };
    }

    revalidatePath(`/studio/posts/${postId}`);
    revalidatePath("/posts");
    return { ok: true, broadcastId: kit.broadcastId };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Publish failed.",
    };
  }
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

async function loadSourceBundles(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sources: (SourceCredit & { id: string })[],
) {
  return Promise.all(
    sources.map(async (s) => {
      const { data: row } = await supabase
        .from("studio_sources")
        .select("summary_en, summary_zh, text_content")
        .eq("id", s.id)
        .single();
      return {
        author: s.author,
        title: s.title,
        url: s.url,
        summaryEn: (row?.summary_en as { summary?: string })?.summary ?? "",
        summaryZh: (row?.summary_zh as { summary?: string })?.summary ?? "",
        fullText: (row?.text_content as string) ?? "",
      };
    }),
  );
}
