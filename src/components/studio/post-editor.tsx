"use client";

import {
  addPostComment,
  addSourceToPost,
  applyPostComments,
  draftPostWithAi,
  generateVariantFromBlogAction,
  publishPostToKit,
  resolvePostComment,
  resolveSuggestion,
  restoreVersion,
  savePost,
  saveVariant,
} from "@/app/actions/studio";
import { SourceCard } from "@/components/studio/source-card";
import { VariantSuggestions } from "@/components/studio/variant-suggestions";
import {
  STUDIO_TABS,
  type PostVariantRecord,
  type StudioChannel,
  type VariantExtra,
} from "@/lib/studio/channels";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

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
  channel?: StudioChannel;
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
};

type VariantState = Record<"x" | "threads" | "zh" | "en", PostVariantRecord>;

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
      },
    },
    en: fromDb.en ?? {
      channel: "en",
      content: post.social_captions?.en ?? "",
      extra: {
        social_title: post.social_title ?? post.title,
        key_point: post.key_point ?? "",
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
  initialTab = "blog",
}: {
  post: EditorPost;
  sources: EditorSource[];
  suggestions: EditorSuggestion[];
  comments: EditorComment[];
  variants: Partial<VariantState>;
  versions: EditorVersion[];
  demoMode?: boolean;
  initialTab?: StudioChannel;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [activeTab, setActiveTab] = useState<StudioChannel>(initialTab);
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
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

  useEffect(() => {
    setLocalSuggestions(suggestions);
  }, [suggestions]);
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  useEffect(() => {
    setVariants(buildInitialVariants(post, initialVariantsFromDb));
  }, [initialVariantsFromDb, post]);

  const bodyDisplay = useMemo(() => stripSourcesForEditor(body), [body]);
  const creditsBlock = useMemo(() => extractSourcesBlock(body), [body]);

  const tabSuggestions = useMemo(
    () => localSuggestions.filter((s) => (s.channel ?? "blog") === activeTab),
    [localSuggestions, activeTab],
  );

  const ogTitle =
    activeTab === "zh" || activeTab === "en"
      ? variants[activeTab].extra.social_title ?? title
      : variants.zh.extra.social_title ?? title;
  const ogKey =
    activeTab === "zh" || activeTab === "en"
      ? variants[activeTab].extra.key_point ?? ""
      : variants.zh.extra.key_point ?? "";
  const socialTitleEnc = encodeURIComponent(ogTitle);
  const socialKeyEnc = encodeURIComponent(ogKey);
  const squareOg = `/api/og/social?title=${socialTitleEnc}&keyPoint=${socialKeyEnc}&format=square&v=${ogTick}`;

  function notify(text: string, isError = false) {
    setMessage(text);
    setMessageIsError(isError);
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

  async function handleSave() {
    if (demoMode) {
      notify("Demo only — connect Supabase to save.", true);
      return;
    }
    start(async () => {
      if (activeTab === "blog") {
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
        });
        if (!result.ok) {
          notify(result.error, true);
          return;
        }
      } else {
        const ch = activeTab as "x" | "threads" | "zh" | "en";
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
      notify(`Saved ${STUDIO_TABS.find((t) => t.id === activeTab)?.label ?? activeTab}`);
      router.refresh();
    });
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
    notify("Copied to clipboard");
  }

  const xChars = variants.x.content.length;
  const threadsChars = variants.threads.content.length;

  return (
    <div className="studio-root">
      <header className="studio-top">
        <div className="studio-top-inner">
          <div className="studio-brand">Content Studio</div>
          <div className="studio-crumb">
            Posts / <strong>{title}</strong>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="studio-status">
              {post.status === "published" ? "Published" : "Draft"}
            </span>
            <Link
              href={demoMode ? "/demo/post" : `/posts/${slug}`}
              className="studio-btn studio-btn-ghost hidden sm:inline-flex"
            >
              Preview
            </Link>
            <button type="button" disabled={pending} className="studio-btn studio-btn-ghost" onClick={handleSave}>
              Save {STUDIO_TABS.find((t) => t.id === activeTab)?.label}
            </button>
            <button
              type="button"
              className="studio-btn studio-btn-black"
              onClick={() =>
                run(async () => {
                  await publishPostToKit(post.id, publishMode, confirmEmail);
                  notify("Published to Kit");
                })
              }
            >
              Publish
            </button>
          </div>
        </div>
      </header>

      {message && (
        <p
          className={`mx-auto max-w-[1320px] px-6 pt-3 text-sm ${
            messageIsError ? "font-medium text-red-700" : "text-[var(--karrot-muted)]"
          }`}
        >
          {message}
        </p>
      )}

      <div className="studio-shell">
        <aside className="studio-panel studio-sources-col">
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

        <main className="studio-panel studio-editor-col studio-editor-main">
          <input
            className="studio-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            readOnly={demoMode}
          />
          <div className="studio-tabs-sticky">
            <div className="studio-tabs">
              {STUDIO_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`studio-tab ${activeTab === tab.id ? "studio-tab-active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === "blog" && (
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
                      await applyPostComments(post.id, activeTab);
                      notify("Applied comments — review the suggestion");
                    })
                  }
                />
              </>
            )}

            {activeTab === "x" && (
              <div>
                <h3 className="studio-block-label">X post</h3>
                <textarea
                  className="w-full rounded-xl border border-[var(--karrot-border)] p-3 text-base leading-relaxed"
                  rows={5}
                  value={variants.x.content}
                  onChange={(e) => updateVariant("x", { content: e.target.value })}
                />
                <p className={`mt-1 text-xs ${xChars > 280 ? "font-semibold text-red-700" : "text-[var(--karrot-muted)]"}`}>
                  {xChars} / 280 characters
                </p>
                <button type="button" className="mt-2 text-xs font-semibold text-[var(--karrot-accent)]" onClick={() => copyText(variants.x.content)}>
                  Copy X post
                </button>
                <p className="mt-4 text-xs font-semibold text-[var(--karrot-muted)]">Thread (optional)</p>
                {(variants.x.extra.thread_parts ?? []).map((part, i) => (
                  <textarea
                    key={i}
                    className="mb-2 w-full rounded-lg border border-[var(--karrot-border)] p-2 text-sm"
                    rows={2}
                    value={part}
                    onChange={(e) => {
                      const parts = [...(variants.x.extra.thread_parts ?? [])];
                      parts[i] = e.target.value;
                      updateVariant("x", { extra: { thread_parts: parts } });
                    }}
                  />
                ))}
                <button
                  type="button"
                  className="studio-btn studio-btn-ghost mt-1 h-8 text-xs"
                  onClick={() =>
                    updateVariant("x", {
                      extra: { thread_parts: [...(variants.x.extra.thread_parts ?? []), ""] },
                    })
                  }
                >
                  Add thread tweet
                </button>
                <VariantSuggestions
                  suggestions={tabSuggestions}
                  demoMode={demoMode}
                  onAccept={(id) => run(() => resolveSuggestion(id, "accept"))}
                  onEdit={(id, text) => run(() => resolveSuggestion(id, "accept", text))}
                  onDismiss={(id) => run(() => resolveSuggestion(id, "dismiss"))}
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="studio-btn studio-btn-primary h-8 text-xs"
                    onClick={() => run(() => generateVariantFromBlogAction(post.id, "x"))}
                  >
                    Generate from blog
                  </button>
                </div>
              </div>
            )}

            {activeTab === "threads" && (
              <div>
                <h3 className="studio-block-label">Threads post</h3>
                <textarea
                  className="w-full rounded-xl border border-[var(--karrot-border)] p-3 text-base leading-relaxed"
                  rows={8}
                  value={variants.threads.content}
                  onChange={(e) => updateVariant("threads", { content: e.target.value })}
                />
                <p className={`mt-1 text-xs ${threadsChars > 500 ? "font-semibold text-red-700" : "text-[var(--karrot-muted)]"}`}>
                  {threadsChars} / 500 characters
                </p>
                <button type="button" className="mt-2 text-xs font-semibold text-[var(--karrot-accent)]" onClick={() => copyText(variants.threads.content)}>
                  Copy Threads post
                </button>
                <VariantSuggestions
                  suggestions={tabSuggestions}
                  demoMode={demoMode}
                  onAccept={(id) => run(() => resolveSuggestion(id, "accept"))}
                  onEdit={(id, text) => run(() => resolveSuggestion(id, "accept", text))}
                  onDismiss={(id) => run(() => resolveSuggestion(id, "dismiss"))}
                />
                <button
                  type="button"
                  className="studio-btn studio-btn-primary mt-4 h-8 text-xs"
                  onClick={() => run(() => generateVariantFromBlogAction(post.id, "threads"))}
                >
                  Generate from blog
                </button>
              </div>
            )}

            {(activeTab === "zh" || activeTab === "en") && (
              <div>
                <h3 className="studio-block-label">
                  {activeTab === "zh" ? "Instagram / Facebook · 中文" : "Instagram / Facebook · English"}
                </h3>
                <label className="studio-field">
                  Image headline (Anton)
                  <input
                    value={variants[activeTab].extra.social_title ?? ""}
                    onChange={(e) =>
                      updateVariant(activeTab, { extra: { social_title: e.target.value } })
                    }
                  />
                </label>
                <label className="studio-field">
                  Key point (Roboto)
                  <input
                    value={variants[activeTab].extra.key_point ?? ""}
                    onChange={(e) =>
                      updateVariant(activeTab, { extra: { key_point: e.target.value } })
                    }
                  />
                </label>
                <label className="mb-1 mt-3 block text-xs font-semibold text-[var(--karrot-muted)]">
                  Caption
                </label>
                <textarea
                  rows={6}
                  className="w-full rounded-lg border border-[var(--karrot-border)] p-3 text-sm leading-relaxed"
                  value={variants[activeTab].content}
                  onChange={(e) => updateVariant(activeTab, { content: e.target.value })}
                />
                <button
                  type="button"
                  className="mt-2 text-xs font-semibold text-[var(--karrot-accent)]"
                  onClick={() => copyText(variants[activeTab].content)}
                >
                  Copy caption
                </button>
                <div className="mt-4 overflow-hidden rounded-lg border border-[var(--karrot-border)]">
                  <img src={squareOg} alt="Social preview" className="w-full" />
                </div>
                <VariantSuggestions
                  suggestions={tabSuggestions}
                  demoMode={demoMode}
                  onAccept={(id) => run(() => resolveSuggestion(id, "accept"))}
                  onEdit={(id, text) => run(() => resolveSuggestion(id, "accept", text))}
                  onDismiss={(id) => run(() => resolveSuggestion(id, "dismiss"))}
                />
                <button
                  type="button"
                  className="studio-btn studio-btn-primary mt-4 h-8 text-xs"
                  onClick={() => run(() => generateVariantFromBlogAction(post.id, activeTab))}
                >
                  Generate from blog
                </button>
              </div>
            )}
          </div>
        </main>

        <aside className="studio-panel studio-aside-settings">
          <div className="studio-panel-h">Post settings</div>
          <div className="studio-panel-b flex flex-col gap-4">
            <div className="studio-field">
              <label>Body language</label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as "zh-HK" | "en")}
                disabled={demoMode}
              >
                <option value="zh-HK">中文</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="studio-field">
              <label>URL slug</label>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} readOnly={demoMode} />
            </div>
            <div className="studio-field">
              <label>Publish to Kit</label>
              <select
                value={publishMode}
                onChange={(e) => setPublishMode(e.target.value as "web_only" | "web_and_email")}
              >
                <option value="web_only">Web only</option>
                <option value="web_and_email">Web and email my list</option>
              </select>
            </div>
            {publishMode === "web_and_email" && (
              <label className="flex items-start gap-2 text-xs leading-snug">
                <input
                  type="checkbox"
                  checked={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.checked)}
                  className="mt-0.5"
                />
                I confirm sending this to my email list
              </label>
            )}
            <div className="studio-ai-box">
              <p>
                Draft for the <strong>{STUDIO_TABS.find((t) => t.id === activeTab)?.label}</strong>{" "}
                tab from attached sources. My take is never changed automatically.
              </p>
              <button
                type="button"
                disabled={pending}
                className="studio-btn studio-btn-primary"
                onClick={() => run(() => draftPostWithAi(post.id, activeTab))}
              >
                Draft from sources
              </button>
            </div>
            {versions.length > 0 && !demoMode && (
              <div>
                <p className="mb-2 text-xs font-semibold">Blog versions</p>
                <ul className="space-y-2 text-xs">
                  {versions.slice(0, 5).map((v) => (
                    <li key={v.id} className="flex justify-between gap-2">
                      <span className="truncate">{new Date(v.created_at).toLocaleString()}</span>
                      <button
                        type="button"
                        className="font-semibold text-[var(--karrot-accent)]"
                        onClick={() => run(() => restoreVersion(v.id))}
                      >
                        Restore
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {post.kit_broadcast_id && (
              <p className="text-xs text-[var(--karrot-muted)]">Kit: {post.kit_broadcast_id}</p>
            )}
          </div>
        </aside>
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
                <button type="button" className="font-semibold text-[var(--karrot-accent)]" onClick={() => onResolve(c.id)}>
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
        <button type="button" className="studio-btn studio-btn-ghost h-8 text-xs" disabled={demoMode || !commentInput.trim()} onClick={onAdd}>
          Add comment
        </button>
        <button type="button" className="studio-btn studio-btn-primary h-8 text-xs" disabled={demoMode} onClick={onApply}>
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
