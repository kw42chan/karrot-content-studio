"use client";

import {
  addPostComment,
  addSourceToPost,
  applyPostComments,
  draftPostWithAi,
  publishPostToKit,
  resolvePostComment,
  resolveSuggestion,
  restoreVersion,
  savePost,
} from "@/app/actions/studio";
import { SourceCard } from "@/components/studio/source-card";
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

export function PostEditor({
  post,
  sources,
  suggestions,
  comments: initialComments,
  versions,
  demoMode = false,
}: {
  post: EditorPost;
  sources: EditorSource[];
  suggestions: EditorSuggestion[];
  comments: EditorComment[];
  versions: EditorVersion[];
  demoMode?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [myTake, setMyTake] = useState(post.my_take);
  const [body, setBody] = useState(post.body);
  const [lang, setLang] = useState(post.body_language);
  const [keyPoint, setKeyPoint] = useState(post.key_point ?? "");
  const [socialTitle, setSocialTitle] = useState(post.social_title ?? post.title);
  const [socialZh, setSocialZh] = useState(post.social_captions?.zh ?? "");
  const [socialEn, setSocialEn] = useState(post.social_captions?.en ?? "");
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

  const bodyDisplay = useMemo(() => stripSourcesForEditor(body), [body]);
  const creditsBlock = useMemo(() => extractSourcesBlock(body), [body]);

  const socialTitleEnc = encodeURIComponent(socialTitle || title);
  const socialKeyEnc = encodeURIComponent(keyPoint);
  const squareOg = `/api/og/social?title=${socialTitleEnc}&keyPoint=${socialKeyEnc}&format=square&v=${ogTick}`;
  const portraitOg = `/api/og/social?title=${socialTitleEnc}&keyPoint=${socialKeyEnc}&format=portrait&v=${ogTick}`;

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

  async function handleSave() {
    if (demoMode) {
      notify("Demo only — connect Supabase to save.", true);
      return;
    }
    start(async () => {
      const result = await savePost({
        id: post.id,
        title,
        slug,
        my_take: myTake,
        body,
        body_language: lang,
        status: post.status,
        key_point: keyPoint,
        social_title: socialTitle,
        social_captions: { zh: socialZh, en: socialEn },
      });
      if (!result.ok) {
        notify(result.error, true);
        return;
      }
      setOgTick((t) => t + 1);
      notify("Saved");
      router.refresh();
    });
  }

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
            <button
              type="button"
              disabled={pending}
              className="studio-btn studio-btn-ghost"
              onClick={handleSave}
            >
              Save
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
              <button
                type="submit"
                className="studio-btn studio-btn-primary px-3"
                disabled={demoMode}
              >
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
          <div className="studio-tabs">
            <button type="button" className="studio-tab studio-tab-active">Blog</button>
            <button type="button" className="studio-tab">X post</button>
            <button type="button" className="studio-tab">Threads</button>
            <button type="button" className="studio-tab">中文</button>
            <button type="button" className="studio-tab">English</button>
          </div>
          <div className="p-6">
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
              {localSuggestions.map((sug) => (
                <div key={sug.id} className="studio-suggest">
                  <p className="mb-2 text-xs font-semibold text-[var(--karrot-accent)]">
                    {sug.label ?? "Suggested from a new source"}
                  </p>
                  <p className="mb-3 text-sm leading-relaxed text-[var(--karrot-muted)]">
                    {sug.paragraph}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="studio-btn studio-btn-primary h-8 px-3 text-xs"
                      onClick={() => {
                        if (demoMode) {
                          setLocalSuggestions((s) => s.filter((x) => x.id !== sug.id));
                          return;
                        }
                        run(() => resolveSuggestion(sug.id, "accept"));
                      }}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="studio-btn studio-btn-ghost h-8 px-3 text-xs"
                      onClick={() => {
                        const edited = window.prompt("Edit before accepting:", sug.paragraph);
                        if (!edited) return;
                        if (demoMode) {
                          setLocalSuggestions((s) => s.filter((x) => x.id !== sug.id));
                          return;
                        }
                        run(() => resolveSuggestion(sug.id, "accept", edited));
                      }}
                    >
                      Edit first
                    </button>
                    <button
                      type="button"
                      className="studio-btn studio-btn-ghost h-8 px-3 text-xs"
                      onClick={() => {
                        if (demoMode) {
                          setLocalSuggestions((s) => s.filter((x) => x.id !== sug.id));
                          return;
                        }
                        run(() => resolveSuggestion(sug.id, "dismiss"));
                      }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {creditsBlock && (
              <div className="studio-credits">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide">Sources</h3>
                <div className="whitespace-pre-wrap text-sm">{creditsBlock}</div>
              </div>
            )}

            <section className="mt-8 rounded-xl border border-[var(--karrot-border)] bg-[var(--karrot-card)] p-5">
              <h3 className="studio-block-label">Comments on this draft</h3>
              <p className="mb-3 text-xs text-[var(--karrot-muted)]">
                Notes for yourself or instructions for AI. Apply sends open comments as a suggestion
                — My take is never changed automatically.
              </p>
              <ul className="mb-4 space-y-2">
                {comments.map((c) => (
                  <li
                    key={c.id}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      c.resolved
                        ? "border-transparent bg-white/50 opacity-60"
                        : "border-[var(--karrot-border)] bg-white"
                    }`}
                  >
                    <p>{c.body}</p>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-[var(--karrot-muted)]">
                      <span>{new Date(c.created_at).toLocaleString()}</span>
                      {c.resolved ? (
                        <span>Resolved</span>
                      ) : (
                        <button
                          type="button"
                          className="font-semibold text-[var(--karrot-accent)]"
                          onClick={() =>
                            run(async () => {
                              await resolvePostComment(c.id);
                              notify("Comment resolved");
                            })
                          }
                        >
                          Mark resolved
                        </button>
                      )}
                    </div>
                  </li>
                ))}
                {!comments.length && (
                  <li className="text-sm text-[var(--karrot-muted)]">No comments yet.</li>
                )}
              </ul>
              <textarea
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                rows={3}
                placeholder="Add a comment or instruction…"
                className="mb-2 w-full rounded-lg border border-[var(--karrot-border)] p-2 text-sm"
                disabled={demoMode}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="studio-btn studio-btn-ghost h-8 text-xs"
                  disabled={demoMode || !commentInput.trim()}
                  onClick={() =>
                    run(async () => {
                      await addPostComment(post.id, commentInput);
                      setCommentInput("");
                      notify("Comment added");
                    })
                  }
                >
                  Add comment
                </button>
                <button
                  type="button"
                  className="studio-btn studio-btn-primary h-8 text-xs"
                  disabled={demoMode}
                  onClick={() =>
                    run(async () => {
                      await applyPostComments(post.id);
                      notify("Applied comments — review the suggestion above");
                    })
                  }
                >
                  Apply comments
                </button>
              </div>
            </section>
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
            <div>
              <p className="mb-2 text-xs font-semibold text-[var(--karrot-muted)]">Social formats</p>
              <label className="studio-field">
                Image headline (Anton)
                <input
                  value={socialTitle}
                  onChange={(e) => {
                    setSocialTitle(e.target.value);
                    setOgTick((t) => t + 1);
                  }}
                />
              </label>
              <label className="studio-field">
                Key point (Roboto)
                <input
                  value={keyPoint}
                  onChange={(e) => {
                    setKeyPoint(e.target.value);
                    setOgTick((t) => t + 1);
                  }}
                />
              </label>
              <label className="mb-1 mt-2 block text-xs font-semibold text-[var(--karrot-muted)]">
                中文 caption
              </label>
              <textarea
                rows={3}
                className="mb-1 w-full rounded-lg border border-[var(--karrot-border)] p-2 text-xs"
                value={socialZh}
                onChange={(e) => setSocialZh(e.target.value)}
              />
              <button
                type="button"
                className="text-xs font-semibold text-[var(--karrot-accent)]"
                onClick={() => navigator.clipboard.writeText(socialZh)}
              >
                Copy 中文 caption
              </button>
              <label className="mb-1 mt-3 block text-xs font-semibold text-[var(--karrot-muted)]">
                English caption
              </label>
              <textarea
                rows={3}
                className="mb-1 w-full rounded-lg border border-[var(--karrot-border)] p-2 text-xs"
                value={socialEn}
                onChange={(e) => setSocialEn(e.target.value)}
              />
              <button
                type="button"
                className="text-xs font-semibold text-[var(--karrot-accent)]"
                onClick={() => navigator.clipboard.writeText(socialEn)}
              >
                Copy English caption
              </button>
              <div className="mt-3 overflow-hidden rounded-lg border border-[var(--karrot-border)]">
                <img src={squareOg} alt="Social preview square" className="w-full" />
              </div>
              <div className="mt-2 flex flex-col gap-1 text-xs font-semibold text-[var(--karrot-accent)]">
                <a href={squareOg} download="karrot-1080-square.png">Download 1080×1080</a>
                <a href={portraitOg} download="karrot-1080x1350.png">Download 1080×1350</a>
              </div>
            </div>
            <div className="studio-ai-box">
              <p>
                Draft a new section from the attached sources. Your My take and accepted edits stay
                untouched.
              </p>
              <button
                type="button"
                disabled={pending}
                className="studio-btn studio-btn-primary"
                onClick={() => run(() => draftPostWithAi(post.id))}
              >
                Draft from sources
              </button>
            </div>
            {versions.length > 0 && !demoMode && (
              <div>
                <p className="mb-2 text-xs font-semibold">Versions</p>
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
