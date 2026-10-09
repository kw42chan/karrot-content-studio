"use client";

import {
  addPostComment,
  addSourceToPost,
  applyPostComments,
  draftPostWithAi,
  generateVariantFromBlogAction,
  quickAdjustVariantAction,
  deletePost,
  fillPostSeo,
  publishToSite,
  saveGenerationPrefs,
  resolvePostComment,
  resolveSuggestion,
  restoreVersion,
  savePost,
  saveVariant,
} from "@/app/actions/studio";
import { ChannelSettingsPanel } from "@/components/studio/channel-settings-panel";
import { GenerationControls, VariantQuickActions } from "@/components/studio/generation-controls";
import { SourceCard } from "@/components/studio/source-card";
import { useStudioNav } from "@/components/studio/shell/studio-nav-context";
import { VariantSuggestions } from "@/components/studio/variant-suggestions";
import {
  DISTRIBUTION_CHANNELS,
  suggestionChannelFor,
  variantKeyFor,
  type ContentLocale,
  type DistributionChannel,
  type PostVariantRecord,
  type SuggestionChannel,
} from "@/lib/studio/channels";
import {
  normalizeGenerationPrefs,
  type ChannelGenerationPrefs,
} from "@/lib/studio/generation-prefs";
import type { PostCategory } from "@/lib/blog/categories";
import { navigateToStudioPostsHomeAfterEditorDelete } from "@/lib/studio/routes";
import {
  isPlaceholderMeta,
  isPlaceholderSeoTitle,
  isPlaceholderSlug,
} from "@/lib/posts/seo-slug";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

export type EditorSource = {
  id: string;
  author: string | null;
  title: string | null;
  url: string;
  platform: string;
  full_text: boolean;
  text_content?: string | null;
  summary_en: { headline?: string; summary?: string; points?: string[] } | null;
  summary_zh: { headline?: string; summary?: string; points?: string[] } | null;
};

export type EditorSuggestion = {
  id: string;
  paragraph: string;
  source_id: string | null;
  label?: string;
  channel?: SuggestionChannel;
};

export type EditorComment = {
  id: string;
  body: string;
  resolved: boolean;
  created_at: string;
};

export type EditorVersion = {
  id: string;
  created_at: string;
  title: string;
};

export type EditorPost = {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  my_take: string;
  body: string;
  body_language: "zh-HK" | "en";
  key_point: string | null;
  social_title: string | null;
  social_captions: { zh?: string; en?: string } | null;
  kit_broadcast_id: string | null;
  seo_title?: string | null;
  meta_description?: string | null;
  category?: PostCategory | null;
  generation_prefs?: ChannelGenerationPrefs | null;
};

type VariantState = Record<"x" | "threads" | "zh" | "en", PostVariantRecord>;

type MobileStep = "sources" | "draft" | "settings";

function buildInitialVariants(
  post: EditorPost,
  fromDb: Partial<VariantState>,
): VariantState {
  return {
    x: fromDb.x ?? { channel: "x", content: "", extra: { thread_parts: [] } },
    threads: fromDb.threads ?? { channel: "threads", content: "", extra: {} },
    zh: fromDb.zh ?? {
      channel: "zh",
      content: post.social_captions?.zh ?? "",
      extra: {
        social_title: post.social_title ?? post.title,
        key_point: post.key_point ?? "",
        aspect: "square",
      },
    },
    en: fromDb.en ?? {
      channel: "en",
      content: post.social_captions?.en ?? "",
      extra: {
        social_title: post.social_title ?? post.title,
        key_point: post.key_point ?? "",
        aspect: "square",
      },
    },
  };
}

export function PostEditor({
  post,
  sources,
  suggestions,
  comments: initialComments,
  variants: initialVariantsFromDb,
  versions,
  demoMode = false,
  initialChannel = "blog",
  initialLocale,
}: {
  post: EditorPost;
  sources: EditorSource[];
  suggestions: EditorSuggestion[];
  comments: EditorComment[];
  variants: Partial<VariantState>;
  versions: EditorVersion[];
  demoMode?: boolean;
  initialChannel?: DistributionChannel;
  initialLocale?: ContentLocale;
}) {
  const router = useRouter();
  const studioNav = useStudioNav();
  const [pending, start] = useTransition();
  const [activeChannel, setActiveChannel] = useState<DistributionChannel>(initialChannel);
  const [contentLocale, setContentLocale] = useState<ContentLocale>(
    initialLocale ?? post.body_language,
  );
  const [mobileStep, setMobileStep] = useState<MobileStep>("draft");
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [seoTitle, setSeoTitle] = useState(post.seo_title ?? post.title);
  const [metaDescription, setMetaDescription] = useState(post.meta_description ?? "");
  const [category, setCategory] = useState<PostCategory | "">(post.category ?? "");
  const slugEdited = useRef(false);
  const seoEdited = useRef(false);
  const metaEdited = useRef(false);
  const [seoFilling, setSeoFilling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [myTake, setMyTake] = useState(post.my_take);
  const [body, setBody] = useState(post.body);
  const [lang, setLang] = useState(post.body_language);
  const [variants, setVariants] = useState<VariantState>(() =>
    buildInitialVariants(post, initialVariantsFromDb),
  );
  const [linkInput, setLinkInput] = useState("");
  const [commentInput, setCommentInput] = useState("");
  const [comments, setComments] = useState(initialComments);
  const [message, setMessage] = useState<string | null>(null);
  const [messageIsError, setMessageIsError] = useState(false);
  const [publishMode, setPublishMode] = useState<"web_only" | "web_and_email">("web_only");
  const [confirmEmail, setConfirmEmail] = useState(false);
  const [localSuggestions, setLocalSuggestions] = useState(suggestions);
  const [ogTick, setOgTick] = useState(0);
  const [generationPrefs, setGenerationPrefs] = useState<ChannelGenerationPrefs>(() =>
    normalizeGenerationPrefs(post.generation_prefs),
  );

  const igStorage = contentLocale === "zh-HK" ? "zh" : "en";
  const igAspect = variants[igStorage].extra.aspect ?? "square";

  useEffect(() => {
    setLocalSuggestions(suggestions);
  }, [suggestions]);
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);
  useEffect(() => {
    setVariants(buildInitialVariants(post, initialVariantsFromDb));
  }, [initialVariantsFromDb, post]);

  useEffect(() => {
    if (activeChannel === "blog") {
      setLang(contentLocale);
    }
  }, [activeChannel, contentLocale]);

  const suggestionChannel = suggestionChannelFor(activeChannel, contentLocale);
  const tabSuggestions = useMemo(
    () => localSuggestions.filter((s) => (s.channel ?? "blog") === suggestionChannel),
    [localSuggestions, suggestionChannel],
  );

  const bodyDisplay = useMemo(() => stripSourcesForEditor(body), [body]);
  const creditsBlock = useMemo(() => extractSourcesBlock(body), [body]);

  const ogTitle = variants[igStorage].extra.social_title ?? title;
  const ogKey = variants[igStorage].extra.key_point ?? "";
  const socialTitleEnc = encodeURIComponent(ogTitle);
  const socialKeyEnc = encodeURIComponent(ogKey);
  const squareOg = `/api/og/social?title=${socialTitleEnc}&keyPoint=${socialKeyEnc}&format=square&v=${ogTick}`;
  const portraitOg = `/api/og/social?title=${socialTitleEnc}&keyPoint=${socialKeyEnc}&format=portrait&v=${ogTick}`;

  const postsHref = demoMode ? "/demo/studio/posts" : "/studio";

  function notify(text: string, isError = false) {
    setMessage(text);
    setMessageIsError(isError);
  }

  function seoFillFlags() {
    return {
      slug: !slugEdited.current && isPlaceholderSlug(slug),
      seoTitle: !seoEdited.current && isPlaceholderSeoTitle(seoTitle),
      metaDescription: !metaEdited.current && isPlaceholderMeta(metaDescription),
    };
  }

  async function fillSeoFromBody(bodyText: string, quiet = false) {
    const fill = seoFillFlags();
    if (!fill.slug && !fill.seoTitle && !fill.metaDescription) {
      if (!quiet) notify("Slug, SEO title, and meta description are already set.");
      return;
    }
    if (!bodyText.trim()) {
      if (!quiet) notify("Add a draft body first.", true);
      return;
    }
    setSeoFilling(true);
    try {
      const result = await fillPostSeo({
        postId: post.id,
        body: bodyText,
        language: contentLocale,
        fill,
      });
      if (!result.ok) {
        notify(quiet ? `Added to the draft, but SEO failed: ${result.error}` : result.error, true);
        return;
      }
      if (result.slug) setSlug(result.slug);
      if (result.seoTitle) setSeoTitle(result.seoTitle);
      if (result.metaDescription) setMetaDescription(result.metaDescription);
      notify(quiet ? "Added to the draft. SEO fields filled." : "SEO fields filled. You can still edit them.");
      router.refresh();
    } finally {
      setSeoFilling(false);
    }
  }

  function run(fn: () => Promise<void>) {
    if (demoMode) {
      notify("Demo only — connect Supabase to save.", true);
      return;
    }
    start(async () => {
      try {
        setMessage(null);
        await fn();
        router.refresh();
      } catch (e) {
        notify(e instanceof Error ? e.message : "Something went wrong", true);
      }
    });
  }

  function updateVariant(
    channel: "x" | "threads" | "zh" | "en",
    patch: Partial<PostVariantRecord>,
  ) {
    setVariants((v) => ({
      ...v,
      [channel]: {
        ...v[channel],
        ...patch,
        extra: { ...v[channel].extra, ...patch.extra },
      },
    }));
    if (channel === "zh" || channel === "en") setOgTick((t) => t + 1);
  }

  function draftChannel(): SuggestionChannel {
    return suggestionChannelFor(activeChannel, contentLocale);
  }

  function persistGenerationPrefs(next: ChannelGenerationPrefs) {
    setGenerationPrefs(next);
    if (demoMode) return;
    start(async () => {
      try {
        await saveGenerationPrefs(post.id, next);
      } catch (e) {
        notify(e instanceof Error ? e.message : "Could not save generation settings", true);
      }
    });
  }

  function runQuickAdjust(adjust: "shorter" | "longer" | "more_detail") {
    run(() => quickAdjustVariantAction(post.id, draftChannel(), adjust, generationPrefs));
  }

  async function handleSave() {
    if (demoMode) {
      notify("Demo only — connect Supabase to save.", true);
      return;
    }
    start(async () => {
      if (activeChannel === "blog") {
        const result = await savePost({
          id: post.id,
          title,
          slug,
          my_take: myTake,
          body,
          body_language: lang,
          status: post.status,
          key_point: variants.zh.extra.key_point,
          social_title: variants.zh.extra.social_title,
          social_captions: { zh: variants.zh.content, en: variants.en.content },
          seo_title: seoTitle,
          meta_description: metaDescription,
          category: category || null,
        });
        if (!result.ok) {
          notify(result.error, true);
          return;
        }
      } else {
        const ch = variantKeyFor(activeChannel, contentLocale);
        if (!ch) return;
        const result = await saveVariant({
          postId: post.id,
          channel: ch,
          content: variants[ch].content,
          extra: variants[ch].extra,
        });
        if (!result.ok) {
          notify(result.error, true);
          return;
        }
      }
      notify("Saved");
      router.refresh();
    });
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
    notify("Copied to clipboard");
  }

  async function handleDeletePost() {
    if (demoMode) {
      notify("Demo only — connect Supabase to delete.", true);
      return;
    }
    const label = title.trim() || slug || "this post";
    if (
      !window.confirm(
        `Delete "${label}" permanently?\n\nThis removes the post from the studio and public /p pages. This cannot be undone.`,
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      const result = await deletePost(post.id);
      if (!result.ok) {
        notify(result.error, true);
        return;
      }
      navigateToStudioPostsHomeAfterEditorDelete();
      return;
    } finally {
      setDeleting(false);
    }
  }

  const xChars = variants.x.content.length;
  const threadsChars = variants.threads.content.length;

  const variantKey = variantKeyFor(activeChannel, contentLocale);
  const variantContent = variantKey ? variants[variantKey].content : "";
  const showGenerateEmpty =
    activeChannel !== "blog" && !variantContent.trim();

  return (
    <div className="studio-editor-page">
      <header className="studio-editor-topbar">
        <div className="studio-editor-topbar-left">
          <button
            type="button"
            className="studio-hamburger studio-hamburger-btn"
            aria-label="Open menu"
            onClick={() => studioNav?.openDrawer()}
          >
            ☰
          </button>
          <div className="studio-crumb-row">
            <span className="studio-editing-label md:hidden">Editing</span>
            <div className="studio-crumb">
              <Link href={postsHref}>Posts</Link>
              <span className="studio-crumb-sep">/</span>
              <span className="studio-crumb-title">{title}</span>
            </div>
          </div>
          <span
            className={`studio-status ${post.status === "published" ? "studio-status-published" : ""}`}
          >
            {post.status === "published" ? "Published" : "Draft"}
          </span>
        </div>
        <div className="studio-editor-topbar-actions">
          <Link
            href={demoMode ? "/demo/post" : `/p/${slug}`}
            className="studio-btn studio-btn-ghost hidden sm:inline-flex"
          >
            Preview
          </Link>
          <button
            type="button"
            disabled={pending}
            className="studio-btn studio-btn-ghost hidden xs:inline-flex"
            onClick={handleSave}
          >
            Save
          </button>
          <button
            type="button"
            className="studio-btn studio-btn-danger sm:hidden"
            disabled={pending || deleting || demoMode}
            onClick={() => void handleDeletePost()}
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
          <button
            type="button"
            className="studio-btn studio-btn-primary"
            disabled={pending || deleting}
            onClick={() =>
              run(async () => {
                const result = await publishToSite({
                  id: post.id,
                  title,
                  slug,
                  my_take: myTake,
                  body,
                  body_language: lang,
                  seo_title: seoTitle,
                  meta_description: metaDescription,
                  category: category || null,
                });
                if (!result.ok) {
                  notify(result.error, true);
                  return;
                }
                const url = `${window.location.origin}/p/${result.slug}`;
                notify(`Published. ${url}`);
              })
            }
          >
            Publish
          </button>
        </div>
      </header>

      {message && (
        <p
          className={`studio-editor-message text-sm ${
            messageIsError ? "font-medium text-red-700" : "text-[var(--karrot-muted)]"
          }`}
        >
          {message?.split(/(https?:\/\/\S+)/).map((part, i) =>
            part.startsWith("http") ? (
              <a key={i} href={part} className="font-semibold text-[var(--karrot-accent)] underline">
                {part}
              </a>
            ) : (
              <span key={i}>{part}</span>
            ),
          )}
        </p>
      )}

      <div className="studio-channel-bar">
        <div className="studio-channels" role="tablist">
          {DISTRIBUTION_CHANNELS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeChannel === tab.id}
              className={`studio-channel-tab ${activeChannel === tab.id ? "active" : ""}`}
              onClick={() => setActiveChannel(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <p className="studio-channel-hint hidden lg:block">
          Right panel updates with channel · {activeChannel} settings
        </p>
      </div>

      <div className="studio-mobile-channels md:hidden">
        {DISTRIBUTION_CHANNELS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`studio-channel-chip ${activeChannel === tab.id ? "active" : ""}`}
            onClick={() => setActiveChannel(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="studio-mobile-segments md:hidden" role="tablist">
        {(["sources", "draft", "settings"] as MobileStep[]).map((step) => (
          <button
            key={step}
            type="button"
            role="tab"
            aria-selected={mobileStep === step}
            className={mobileStep === step ? "active" : ""}
            onClick={() => setMobileStep(step)}
          >
            {step === "sources" ? "Sources" : step === "draft" ? "Draft" : "Settings"}
          </button>
        ))}
      </div>

      <div className={`studio-shell studio-shell-step-${mobileStep}`}>
        <aside className="studio-panel studio-sources-col studio-panel-sources">
          <div className="studio-panel-h">
            <span>Sources</span>
            <span className="text-xs font-normal text-[var(--karrot-muted)]">
              {sources.length} attached
            </span>
          </div>
          <div className="studio-panel-b">
            <form
              className="mb-4 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                run(async () => {
                  await addSourceToPost(post.id, linkInput);
                  setLinkInput("");
                  notify("Source added");
                });
              }}
            >
              <input
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="Paste X, Threads, or web link"
                className="min-w-0 flex-1 rounded-lg border border-[var(--karrot-border)] px-2.5 py-2 text-sm"
                disabled={demoMode}
              />
              <button type="submit" className="studio-btn studio-btn-primary px-3" disabled={demoMode}>
                +
              </button>
            </form>
            {sources.map((s) => (
              <SourceCard key={s.id} source={s} />
            ))}
          </div>
        </aside>

        <main className="studio-panel studio-editor-col studio-panel-draft">
          <input
            className="studio-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            readOnly={demoMode}
          />
          <div className="studio-lang-bar">
            <span className="studio-lang-label">Language</span>
            <div className="studio-seg" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={contentLocale === "zh-HK"}
                onClick={() => setContentLocale("zh-HK")}
              >
                中文
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={contentLocale === "en"}
                onClick={() => setContentLocale("en")}
              >
                English
              </button>
            </div>
          </div>

          <div className="studio-editor-body p-6">
            {activeChannel === "blog" && (
              <>
                <div className="mb-6">
                  <h3 className="studio-block-label">My take</h3>
                  <div className="studio-mytake">
                    <textarea
                      value={myTake}
                      onChange={(e) => setMyTake(e.target.value)}
                      readOnly={demoMode}
                    />
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--karrot-muted)]">
                    Draft from sources
                  </h3>
                  <div className="studio-draft-area rounded-xl border border-[var(--karrot-border)] bg-[var(--karrot-bg)]/40 p-3">
                    <textarea
                      value={bodyDisplay}
                      onChange={(e) => setBody(mergeBodyWithSources(e.target.value, body))}
                      rows={14}
                      readOnly={demoMode}
                      className="min-h-[280px]"
                    />
                  </div>
                  <button
                    type="button"
                    className="mt-2 text-xs font-semibold text-[var(--karrot-accent)]"
                    onClick={() => copyText(bodyDisplay)}
                  >
                    Copy blog body
                  </button>
                </div>
                <VariantSuggestions
                  suggestions={tabSuggestions}
                  demoMode={demoMode}
                  onAccept={(id) => run(() => resolveSuggestion(id, "accept"))}
                  onEdit={(id, text) => run(() => resolveSuggestion(id, "accept", text))}
                  onDismiss={(id) => run(() => resolveSuggestion(id, "dismiss"))}
                />
                {creditsBlock && (
                  <div className="studio-credits">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide">Sources</h3>
                    <div className="whitespace-pre-wrap text-sm">{creditsBlock}</div>
                  </div>
                )}
                <CommentsSection
                  comments={comments}
                  commentInput={commentInput}
                  setCommentInput={setCommentInput}
                  demoMode={demoMode}
                  onAdd={() =>
                    run(async () => {
                      await addPostComment(post.id, commentInput);
                      setCommentInput("");
                      notify("Comment added");
                    })
                  }
                  onResolve={(id) =>
                    run(async () => {
                      await resolvePostComment(id);
                      notify("Comment resolved");
                    })
                  }
                  onApply={() =>
                    run(async () => {
                      await applyPostComments(post.id, draftChannel());
                      notify("Applied comments — review the suggestion");
                    })
                  }
                />
                <VariantQuickActions disabled={demoMode} onAdjust={runQuickAdjust} />
              </>
            )}

            {activeChannel === "x" && (
              <VariantChannelEditor
                label="X post"
                content={variants.x.content}
                onChange={(c) => updateVariant("x", { content: c })}
                charLimit={280}
                charCount={xChars}
                onCopy={() => copyText(variants.x.content)}
                showGenerate={showGenerateEmpty}
                onGenerate={() =>
                  run(() => generateVariantFromBlogAction(post.id, "x", generationPrefs))
                }
                channel="x"
                generationPrefs={generationPrefs}
                onPrefsChange={persistGenerationPrefs}
                onQuickAdjust={runQuickAdjust}
                suggestions={tabSuggestions}
                demoMode={demoMode}
                run={run}
              />
            )}

            {activeChannel === "threads" && (
              <VariantChannelEditor
                label="Threads post"
                content={variants.threads.content}
                onChange={(c) => updateVariant("threads", { content: c })}
                charLimit={500}
                charCount={threadsChars}
                onCopy={() => copyText(variants.threads.content)}
                showGenerate={showGenerateEmpty}
                onGenerate={() =>
                  run(() => generateVariantFromBlogAction(post.id, "threads", generationPrefs))
                }
                channel="threads"
                generationPrefs={generationPrefs}
                onPrefsChange={persistGenerationPrefs}
                onQuickAdjust={runQuickAdjust}
                suggestions={tabSuggestions}
                demoMode={demoMode}
                run={run}
              />
            )}

            {activeChannel === "instagram" && (
              <div>
                {showGenerateEmpty ? (
                  <div className="studio-generate-empty">
                    <p>No {contentLocale === "zh-HK" ? "中文" : "English"} caption yet.</p>
                    <button
                      type="button"
                      className="studio-btn studio-btn-primary"
                      onClick={() =>
                        run(() =>
                          generateVariantFromBlogAction(post.id, igStorage, generationPrefs),
                        )
                      }
                    >
                      Generate from blog
                    </button>
                  </div>
                ) : (
                  <>
                    <label className="studio-field">
                      Image headline (Anton)
                      <input
                        value={variants[igStorage].extra.social_title ?? ""}
                        onChange={(e) =>
                          updateVariant(igStorage, { extra: { social_title: e.target.value } })
                        }
                      />
                    </label>
                    <label className="studio-field">
                      Key point (Roboto)
                      <input
                        value={variants[igStorage].extra.key_point ?? ""}
                        onChange={(e) =>
                          updateVariant(igStorage, { extra: { key_point: e.target.value } })
                        }
                      />
                    </label>
                    <label className="mb-1 mt-3 block text-xs font-semibold text-[var(--karrot-muted)]">
                      Caption
                    </label>
                    <textarea
                      rows={6}
                      className="w-full rounded-lg border border-[var(--karrot-border)] p-3 text-sm leading-relaxed"
                      value={variants[igStorage].content}
                      onChange={(e) => updateVariant(igStorage, { content: e.target.value })}
                    />
                    <button
                      type="button"
                      className="mt-2 text-xs font-semibold text-[var(--karrot-accent)]"
                      onClick={() => copyText(variants[igStorage].content)}
                    >
                      Copy caption
                    </button>
                  </>
                )}
                <VariantSuggestions
                  suggestions={tabSuggestions}
                  demoMode={demoMode}
                  onAccept={(id) => run(() => resolveSuggestion(id, "accept"))}
                  onEdit={(id, text) => run(() => resolveSuggestion(id, "accept", text))}
                  onDismiss={(id) => run(() => resolveSuggestion(id, "dismiss"))}
                />
                {!showGenerateEmpty && (
                  <div className="mt-4 flex flex-col gap-3">
                    <button
                      type="button"
                      className="studio-btn studio-btn-primary h-8 text-xs"
                      onClick={() =>
                        run(() =>
                          generateVariantFromBlogAction(post.id, igStorage, generationPrefs),
                        )
                      }
                    >
                      Regenerate from blog
                    </button>
                    <VariantQuickActions disabled={demoMode} onAdjust={runQuickAdjust} />
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        <ChannelSettingsPanel
          channel={activeChannel}
          locale={contentLocale}
          post={post}
          slug={slug}
          setSlug={(v) => {
            slugEdited.current = true;
            setSlug(v);
          }}
          seoTitle={seoTitle}
          setSeoTitle={(v) => {
            seoEdited.current = true;
            setSeoTitle(v);
          }}
          metaDescription={metaDescription}
          setMetaDescription={(v) => {
            metaEdited.current = true;
            setMetaDescription(v);
          }}
          category={category}
          setCategory={setCategory}
          onFillSeo={() => void fillSeoFromBody(stripSourcesForEditor(body))}
          seoFilling={seoFilling}
          publishMode={publishMode}
          setPublishMode={setPublishMode}
          confirmEmail={confirmEmail}
          setConfirmEmail={setConfirmEmail}
          xChars={xChars}
          threadsChars={threadsChars}
          threadParts={variants.x.extra.thread_parts ?? []}
          onAddThreadPart={() =>
            updateVariant("x", {
              extra: { thread_parts: [...(variants.x.extra.thread_parts ?? []), ""] },
            })
          }
          onUpdateThreadPart={(i, v) => {
            const parts = [...(variants.x.extra.thread_parts ?? [])];
            parts[i] = v;
            updateVariant("x", { extra: { thread_parts: parts } });
          }}
          igAspect={igAspect}
          setIgAspect={(a) => updateVariant(igStorage, { extra: { aspect: a } })}
          squareOg={squareOg}
          portraitOg={portraitOg}
          onDownloadOg={(url, name) => {
            const a = document.createElement("a");
            a.href = url;
            a.download = name;
            a.click();
          }}
          demoMode={demoMode}
          pending={pending}
          onDraftFromSources={() =>
            run(() => draftPostWithAi(post.id, draftChannel(), generationPrefs))
          }
          generationPrefs={generationPrefs}
          onGenerationPrefsChange={persistGenerationPrefs}
          versions={versions}
          onRestoreVersion={(id) => run(() => restoreVersion(id))}
          onDeletePost={demoMode ? undefined : () => void handleDeletePost()}
          deletePending={deleting}
        />
      </div>
    </div>
  );
}

function VariantChannelEditor({
  label,
  content,
  onChange,
  charLimit,
  charCount,
  onCopy,
  showGenerate,
  onGenerate,
  channel,
  generationPrefs,
  onPrefsChange,
  onQuickAdjust,
  suggestions,
  demoMode,
  run,
}: {
  label: string;
  content: string;
  onChange: (c: string) => void;
  charLimit: number;
  charCount: number;
  onCopy: () => void;
  showGenerate: boolean;
  onGenerate: () => void;
  channel: "x" | "threads";
  generationPrefs: ChannelGenerationPrefs;
  onPrefsChange: (p: ChannelGenerationPrefs) => void;
  onQuickAdjust: (a: "shorter" | "longer" | "more_detail") => void;
  suggestions: EditorSuggestion[];
  demoMode: boolean;
  run: (fn: () => Promise<void>) => void;
}) {
  if (showGenerate) {
    return (
      <div className="studio-generate-empty">
        <p>No draft for this channel yet.</p>
        <GenerationControls
          channel={channel}
          prefs={generationPrefs}
          onChange={onPrefsChange}
          disabled={demoMode}
        />
        <button type="button" className="studio-btn studio-btn-primary mt-3" onClick={onGenerate}>
          Generate from blog
        </button>
      </div>
    );
  }
  return (
    <div>
      <h3 className="studio-block-label">{label}</h3>
      <textarea
        className="w-full rounded-xl border border-[var(--karrot-border)] p-3 text-base leading-relaxed"
        rows={8}
        value={content}
        onChange={(e) => onChange(e.target.value)}
      />
      <p
        className={`mt-1 text-xs md:hidden ${charCount > charLimit ? "font-semibold text-red-700" : "text-[var(--karrot-muted)]"}`}
      >
        {charCount} / {charLimit} characters
      </p>
      <button type="button" className="mt-2 text-xs font-semibold text-[var(--karrot-accent)]" onClick={onCopy}>
        Copy
      </button>
      <VariantSuggestions
        suggestions={suggestions}
        demoMode={demoMode}
        onAccept={(id) => run(() => resolveSuggestion(id, "accept"))}
        onEdit={(id, text) => run(() => resolveSuggestion(id, "accept", text))}
        onDismiss={(id) => run(() => resolveSuggestion(id, "dismiss"))}
      />
      <div className="mt-4 flex flex-col gap-3">
        <GenerationControls
          channel={channel}
          prefs={generationPrefs}
          onChange={onPrefsChange}
          disabled={demoMode}
        />
        <button type="button" className="studio-btn studio-btn-primary h-8 text-xs" onClick={onGenerate}>
          Regenerate from blog
        </button>
        <VariantQuickActions disabled={demoMode} onAdjust={onQuickAdjust} />
      </div>
    </div>
  );
}

function CommentsSection({
  comments,
  commentInput,
  setCommentInput,
  demoMode,
  onAdd,
  onResolve,
  onApply,
}: {
  comments: EditorComment[];
  commentInput: string;
  setCommentInput: (v: string) => void;
  demoMode: boolean;
  onAdd: () => void;
  onResolve: (id: string) => void;
  onApply: () => void;
}) {
  return (
    <section className="mt-8 rounded-xl border border-[var(--karrot-border)] bg-[var(--karrot-card)] p-5">
      <h3 className="studio-block-label">Comments on this draft</h3>
      <ul className="mb-4 space-y-2">
        {comments.map((c) => (
          <li
            key={c.id}
            className={`rounded-lg border px-3 py-2 text-sm ${
              c.resolved ? "opacity-60" : "border-[var(--karrot-border)] bg-white"
            }`}
          >
            <p>{c.body}</p>
            <div className="mt-1 flex justify-between text-[11px] text-[var(--karrot-muted)]">
              <span>{new Date(c.created_at).toLocaleString()}</span>
              {!c.resolved && (
                <button
                  type="button"
                  className="font-semibold text-[var(--karrot-accent)]"
                  onClick={() => onResolve(c.id)}
                >
                  Mark resolved
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <textarea
        value={commentInput}
        onChange={(e) => setCommentInput(e.target.value)}
        rows={3}
        placeholder="Add a comment…"
        className="mb-2 w-full rounded-lg border border-[var(--karrot-border)] p-2 text-sm"
        disabled={demoMode}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="studio-btn studio-btn-ghost h-8 text-xs"
          disabled={demoMode || !commentInput.trim()}
          onClick={onAdd}
        >
          Add comment
        </button>
        <button
          type="button"
          className="studio-btn studio-btn-primary h-8 text-xs"
          disabled={demoMode}
          onClick={onApply}
        >
          Apply comments
        </button>
      </div>
    </section>
  );
}

function stripSourcesForEditor(body: string): string {
  return body.replace(/\n## Sources[\s\S]*$/m, "").trim();
}

function extractSourcesBlock(body: string): string {
  const m = body.match(/\n## Sources([\s\S]*)$/m);
  return m ? `## Sources${m[1]}`.trim() : "";
}

function mergeBodyWithSources(edited: string, previous: string): string {
  const sourcesPart = previous.match(/\n## Sources[\s\S]*$/m)?.[0] ?? "";
  return `${edited.trim()}${sourcesPart}`;
}
