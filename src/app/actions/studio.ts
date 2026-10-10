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
import { generateSeoFields } from "@/lib/ai/seo";
import { computeReadTimeMinutes } from "@/lib/blog/read-time";
import { stripSourcesSection } from "@/lib/blog/format";
import type { PostCategory } from "@/lib/blog/categories";
import { applyPostLinkToVariant, publicPostUrlForSlug } from "@/lib/ai/variant-link";
import { keyPointFields } from "@/lib/posts/key-points";
import { publicPostPath } from "@/lib/posts/site-publish";
import {
  deriveMetaDescription,
  proposeSlugFromTitle,
  publishPreflightMessage,
  publishValidationMessage,
  resolvePublishFields,
} from "@/lib/posts/publish-prep";
import {
  effectiveSeoTitle,
  isPlaceholderSeoTitle,
  isPlaceholderSlug,
  seoSlug,
  withSlugSuffix,
} from "@/lib/posts/seo-slug";
import { slugify } from "@/lib/posts/slugify";
import { readSourceFromUrl } from "@/lib/sources/read-source";
import type { BilingualSummary } from "@/lib/sources/types";
import { createClient } from "@/lib/supabase/server";
import { getAdminEmail } from "@/lib/env";

export type SavePostResult = { ok: true } | { ok: false; error: string };

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

export type DeletePostResult = { ok: true } | { ok: false; error: string };

/** Permanently removes a post; child rows cascade via FK on delete. */
export async function deletePost(postId: string): Promise<DeletePostResult> {
  try {
    const supabase = await requireAdmin();
    const { data: post, error: loadErr } = await supabase
      .from("studio_posts")
      .select("id, slug")
      .eq("id", postId)
      .maybeSingle();
    if (loadErr) return { ok: false, error: loadErr.message };
    if (!post) return { ok: false, error: "Post not found." };

    const { error: delErr } = await supabase.from("studio_posts").delete().eq("id", postId);
    if (delErr) {
      return {
        ok: false,
        error: `Delete failed: ${delErr.message}${delErr.code ? ` (${delErr.code})` : ""}`,
      };
    }

    revalidatePath("/studio");
    revalidatePath(`/studio/posts/${postId}`);
    revalidatePath("/p");
    revalidatePath("/posts");
    if (post.slug) {
      revalidatePath(publicPostPath(post.slug as string));
      revalidatePath(`/posts/${post.slug}`);
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Delete failed." };
  }
}

export type CreatedSuggestion = {
  id: string;
  paragraph: string;
  source_id: null;
  label?: string;
  channel: SuggestionChannel;
  extra?: { social_title?: string; key_point?: string; thread_parts?: string[] };
};

export type ActionResult =
  | { ok: true; suggestion?: CreatedSuggestion }
  | { ok: false; error: string };

export type FillSeoResult =
  | { ok: true; slug?: string; seoTitle?: string; metaDescription?: string }
  | { ok: false; error: string };

export async function fillPostSeo(input: {
  postId: string;
  title: string;
  myTake: string;
  body: string;
  language: "zh-HK" | "en";
  currentSlug: string;
  currentSeoTitle: string;
  fill: { slug: boolean; seoTitle: boolean; metaDescription: boolean };
}): Promise<FillSeoResult> {
  try {
    if (!input.fill.slug && !input.fill.seoTitle && !input.fill.metaDescription) {
      return { ok: true };
    }
    if (!input.body.trim()) return { ok: false, error: "Add a draft body first." };
    const supabase = await requireAdmin();
    const patch: { slug?: string; seo_title?: string; meta_description?: string } = {};
    let slugOut: string | undefined;
    let seoOut: string | undefined;
    let metaOut: string | undefined;

    if (input.fill.metaDescription) {
      metaOut = deriveMetaDescription({
        metaDescription: "",
        myTake: input.myTake,
        body: input.body,
      });
      if (metaOut) patch.meta_description = metaOut;
    }

    if (input.fill.seoTitle) {
      seoOut = effectiveSeoTitle(input.currentSeoTitle, input.title);
      if (isPlaceholderSeoTitle(seoOut) && !isPlaceholderSeoTitle(input.title)) {
        seoOut = input.title.trim().slice(0, 60);
      }
      if (!isPlaceholderSeoTitle(seoOut)) patch.seo_title = seoOut;
    }

    if (input.fill.slug) {
      const seoForSlug = seoOut ?? effectiveSeoTitle(input.currentSeoTitle, input.title);
      let slug = proposeSlugFromTitle(input.title, input.postId, seoForSlug);
      if (isPlaceholderSlug(slug)) {
        slug = proposeSlugFromTitle(input.title || "post", input.postId, seoForSlug);
      }
      const { data: clash } = await supabase
        .from("studio_posts")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (clash && clash.id !== input.postId) {
        slug = withSlugSuffix(slug, input.postId.replace(/-/g, "").slice(0, 4));
      }
      patch.slug = slug;
      slugOut = slug;
    }

    const needAiSeo =
      (input.fill.seoTitle && (!seoOut || isPlaceholderSeoTitle(seoOut))) ||
      (input.fill.slug && slugOut && isPlaceholderSlug(slugOut));
    if (needAiSeo) {
      const drafted = await generateSeoFields({ body: input.body, language: input.language });
      if (input.fill.seoTitle && isPlaceholderSeoTitle(seoOut ?? "")) {
        seoOut = drafted.seoTitle;
        patch.seo_title = seoOut;
      }
      if (input.fill.slug && (!slugOut || isPlaceholderSlug(slugOut))) {
        let slug = drafted.slug || seoSlug(drafted.seoTitle) || slugOut || "post";
        const { data: clash } = await supabase
          .from("studio_posts")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();
        if (clash && clash.id !== input.postId) {
          slug = withSlugSuffix(slug, input.postId.replace(/-/g, "").slice(0, 4));
        }
        slugOut = slug;
        patch.slug = slug;
      }
      if (input.fill.metaDescription && !metaOut && drafted.metaDescription) {
        metaOut = drafted.metaDescription;
        patch.meta_description = metaOut;
      }
    }

    if (!Object.keys(patch).length) {
      return { ok: false, error: "Could not derive SEO fields — add a title or more body text." };
    }

    const { error } = await supabase.from("studio_posts").update(patch).eq("id", input.postId);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/studio/posts/${input.postId}`);
    return {
      ok: true,
      slug: slugOut,
      seoTitle: seoOut,
      metaDescription: metaOut,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}

async function ensureUniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  slug: string,
  postId: string,
): Promise<string> {
  let candidate = slug.trim();
  if (!candidate) candidate = "post";
  const { data: clash } = await supabase
    .from("studio_posts")
    .select("id")
    .eq("slug", candidate)
    .maybeSingle();
  if (!clash || clash.id === postId) return candidate;
  return withSlugSuffix(candidate, postId.replace(/-/g, "").slice(0, 6));
}

export async function publishToSite(input: {
  id: string;
  title: string;
  slug: string;
  my_take: string;
  body: string;
  body_language: "zh-HK" | "en";
  seo_title: string;
  meta_description: string;
  category?: PostCategory | null;
  key_point?: string;
  social_title?: string;
  social_captions?: { zh?: string; en?: string };
  status?: "draft" | "published";
  slug_manually_edited?: boolean;
}): Promise<SavePostResult & { slug?: string }> {
  try {
    const preflight = publishPreflightMessage({
      title: input.title,
      body: input.body,
    });
    if (preflight) return { ok: false, error: preflight };

    const resolved = resolvePublishFields({
      title: input.title,
      slug: input.slug,
      seoTitle: input.seo_title,
      metaDescription: input.meta_description,
      myTake: input.my_take,
      body: input.body,
      postId: input.id,
      status: input.status ?? "draft",
      slugManuallyEdited: input.slug_manually_edited ?? false,
    });

    const blocked = publishValidationMessage({ ...resolved, postTitle: input.title });
    if (blocked) return { ok: false, error: blocked };

    const supabase = await requireAdmin();
    const slugOut = await ensureUniqueSlug(supabase, resolved.slug, input.id);

    const saved = await savePost({
      ...input,
      slug: slugOut,
      status: "published",
      seo_title: resolved.seoTitle,
      meta_description: resolved.metaDescription,
      category: input.category,
    });
    if (!saved.ok) return saved;

    revalidatePath("/p");
    revalidatePath(publicPostPath(slugOut));
    revalidatePath(`/studio/posts/${input.id}`);
    revalidatePath(`/preview/post/${input.id}`);
    return { ok: true, slug: slugOut };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Publish failed." };
  }
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
  category?: PostCategory | null;
}): Promise<SavePostResult> {
  try {
    const supabase = await requireAdmin();

    const sources = await loadPostSources(supabase, input.id);
    const sourcesMd = buildSourcesMarkdown(sources);
    const bodyWithSources = appendSourcesToBody(input.body, sourcesMd);
    const bodyForMetrics = stripSourcesSection(bodyWithSources);
    const read_time = computeReadTimeMinutes(bodyForMetrics, input.body_language);
    const excerpt =
      input.meta_description?.trim() ||
      input.my_take?.trim() ||
      bodyForMetrics.split(/\n\n+/)[0]?.trim().slice(0, 280) ||
      null;

    const { data: existingRow } = await supabase
      .from("studio_posts")
      .select("published_at")
      .eq("id", input.id)
      .maybeSingle();

    const payload = {
      title: input.title,
      slug: input.slug || slugify(input.title),
      my_take: input.my_take,
      body: bodyWithSources,
      body_language: input.body_language,
      status: input.status,
      ...keyPointFields(input.key_point),
      social_title: input.social_title ?? null,
      social_captions: input.social_captions ?? null,
      seo_title: input.seo_title ?? null,
      meta_description: input.meta_description ?? null,
      category: input.category ?? null,
      read_time,
      excerpt,
      published_at:
        input.status === "published"
          ? (existingRow?.published_at ?? new Date().toISOString())
          : null,
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
      console.error("[studio] version history insert failed:", versionErr.message);
    }

    revalidatePath(`/studio/posts/${input.id}`);
    revalidatePath("/posts");
    revalidatePath("/p");
    if (input.slug) revalidatePath(publicPostPath(input.slug));
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
      const postPatch: Record<string, unknown> = {
        social_captions: {
          ...caps,
          [input.channel === "zh" ? "zh" : "en"]: input.content,
        },
        ...(extra.social_title ? { social_title: extra.social_title } : {}),
      };
      if (typeof extra.key_point === "string") {
        Object.assign(postPatch, keyPointFields(extra.key_point));
      }
      await supabase.from("studio_posts").update(postPatch).eq("id", input.postId);
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
  contentLanguage?: "zh-HK" | "en",
): Promise<ActionResult> {
  try {
    if (channel === "blog") return { ok: false, error: "Use the blog tab for blog drafts." };
    const supabase = await requireAdmin();
    const { data: post } = await supabase.from("studio_posts").select("*").eq("id", postId).single();
    if (!post) return { ok: false, error: "Post not found." };

    const prefs = normalizeGenerationPrefs(prefsInput ?? post.generation_prefs);
    await saveGenerationPrefs(postId, prefs);

    const blogBody = stripSourcesSection(post.body as string);
    if (!blogBody.trim()) {
      return { ok: false, error: "Write or draft the blog body first, then generate from blog." };
    }

    const language = (contentLanguage ?? post.body_language) as "zh-HK" | "en";
    const rawGenerated = await generateVariantFromBlog({
      channel,
      postTitle: post.title,
      blogBody,
      language,
      prefs,
    });
    const generated = applyPostLinkToVariant(
      rawGenerated,
      publicPostUrlForSlug(post.slug as string),
    );

    const { data: inserted, error: sugErr } = await supabase
      .from("studio_suggestions")
      .insert({
        post_id: postId,
        source_id: null,
        paragraph: generated.content,
        status: "pending",
        label: "Generated from blog",
        channel,
        extra: generated.extra ?? {},
      })
      .select("id, paragraph, label, channel, extra")
      .single();
    if (sugErr) return { ok: false, error: sugErr.message };
    revalidatePath(`/studio/posts/${postId}`);
    return {
      ok: true,
      suggestion: {
        id: inserted.id,
        paragraph: inserted.paragraph as string,
        source_id: null,
        label: inserted.label ?? "Generated from blog",
        channel: inserted.channel as SuggestionChannel,
        extra: (inserted.extra as CreatedSuggestion["extra"]) ?? undefined,
      },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Generate from blog failed." };
  }
}

export async function quickAdjustVariantAction(
  postId: string,
  channel: SuggestionChannel,
  adjust: "shorter" | "longer" | "more_detail",
  prefsInput?: PostGenerationPrefs,
): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin();
    const { data: post } = await supabase.from("studio_posts").select("*").eq("id", postId).single();
    if (!post) return { ok: false, error: "Post not found." };

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
      if (!body.trim()) {
        return {
          ok: false,
          error: "Write or draft blog content first, then try Make shorter / longer again.",
        };
      }
      const revised = await adjustBlogBody({
        title: post.title,
        language,
        currentBody: body,
        adjust,
        sources: adjust === "more_detail" ? bundles : undefined,
      });
      const { data: inserted, error: sugErr } = await supabase
        .from("studio_suggestions")
        .insert({
          post_id: postId,
          source_id: null,
          paragraph: revised,
          status: "pending",
          label,
          channel: "blog",
        })
        .select("id, paragraph, label, channel, extra")
        .single();
      if (sugErr) return { ok: false, error: sugErr.message };
      revalidatePath(`/studio/posts/${postId}`);
      return {
        ok: true,
        suggestion: {
          id: inserted.id,
          paragraph: inserted.paragraph as string,
          source_id: null,
          label: inserted.label ?? label,
          channel: "blog",
          extra: (inserted.extra as CreatedSuggestion["extra"]) ?? undefined,
        },
      };
    } else {
      const { data: existing } = await supabase
        .from("studio_post_variants")
        .select("content, extra")
        .eq("post_id", postId)
        .eq("channel", channel)
        .maybeSingle();

      const content = (existing?.content as string) ?? "";
      if (!content.trim()) {
        return { ok: false, error: "No content to adjust — generate or draft first." };
      }

      const adjustedRaw = await adjustVariantContent({
        channel,
        adjust,
        postTitle: post.title,
        language,
        currentContent: content,
        currentExtra: (existing?.extra as Record<string, unknown>) ?? {},
        sources: adjust === "more_detail" ? bundles : undefined,
        prefs,
      });
      const adjusted =
        channel === "x" || channel === "threads"
          ? applyPostLinkToVariant(adjustedRaw, publicPostUrlForSlug(post.slug as string))
          : adjustedRaw;

      const { data: inserted, error: sugErr } = await supabase
        .from("studio_suggestions")
        .insert({
          post_id: postId,
          source_id: null,
          paragraph: adjusted.content,
          status: "pending",
          label,
          channel,
          extra: adjusted.extra ?? {},
        })
        .select("id, paragraph, label, channel, extra")
        .single();
      if (sugErr) return { ok: false, error: sugErr.message };
      revalidatePath(`/studio/posts/${postId}`);
      return {
        ok: true,
        suggestion: {
          id: inserted.id,
          paragraph: inserted.paragraph as string,
          source_id: null,
          label: inserted.label ?? label,
          channel: inserted.channel as SuggestionChannel,
          extra: (inserted.extra as CreatedSuggestion["extra"]) ?? undefined,
        },
      };
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Adjust failed." };
  }
}

export type ResolveSuggestionResult =
  | {
      ok: true;
      label?: string | null;
      channel?: SuggestionChannel;
      body?: string;
    }
  | { ok: false; error: string };

export async function resolveSuggestion(
  suggestionId: string,
  action: "accept" | "dismiss",
  editedText?: string,
): Promise<ResolveSuggestionResult> {
  try {
    const supabase = await requireAdmin();
    const { data: sug } = await supabase
      .from("studio_suggestions")
      .select("*")
      .eq("id", suggestionId)
      .single();
    if (!sug) return { ok: false, error: "Suggestion not found." };

    if (action === "dismiss") {
      await supabase
        .from("studio_suggestions")
        .update({ status: "dismissed" })
        .eq("id", suggestionId);
      revalidatePath(`/studio/posts/${sug.post_id}`);
      return { ok: true, label: sug.label, channel: (sug.channel as SuggestionChannel) ?? "blog" };
    }

    const { data: post } = await supabase
      .from("studio_posts")
      .select("body, my_take, title, body_language")
      .eq("id", sug.post_id)
      .single();
    if (!post) return { ok: false, error: "Post missing." };

    const paragraph = editedText ?? (sug.paragraph as string);
    const channel = (sug.channel as SuggestionChannel) ?? "blog";
    const extra =
      (sug.extra as VariantExtra & { social_captions?: { zh?: string; en?: string } }) ?? {};

    let newBody: string | undefined;

    if (channel === "blog") {
      const sources = await loadPostSources(supabase, sug.post_id as string);
      const sourcesMd = buildSourcesMarkdown(sources);
      const marker = "## Sources";
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
      // Prefer key_points (jsonb) when present; keep key_point for older rows.
      if (extra.key_point) {
        Object.assign(postUpdate, keyPointFields(extra.key_point));
      }
      if (extra.social_captions) postUpdate.social_captions = extra.social_captions;

      const { error: upErr } = await supabase
        .from("studio_posts")
        .update(postUpdate)
        .eq("id", sug.post_id)
        .select("id")
        .single();
      if (upErr) return { ok: false, error: upErr.message };

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
      if (vErr) return { ok: false, error: vErr.message };

      if (extra.key_point) {
        await supabase
          .from("studio_posts")
          .update(keyPointFields(extra.key_point))
          .eq("id", sug.post_id);
      }

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
    return {
      ok: true,
      label: sug.label,
      channel,
      body: newBody,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not apply suggestion." };
  }
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

  const kitResult = await publishToKit({
    subject: post.title,
    contentHtml: html,
    broadcastId: post.kit_broadcast_id,
    mode,
    confirmEmail,
  });
  if (!kitResult.ok) {
    throw new Error(kitResult.error);
  }
  const { broadcastId } = kitResult;

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
  revalidatePath("/p");
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
