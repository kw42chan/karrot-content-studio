"use client";

import {
  addSourceToPost,
  draftPostWithAi,
  publishPostToKit,
  resolveSuggestion,
  restoreVersion,
  savePost,
} from "@/app/actions/studio";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

export type EditorSource = {
  id: string;
  author: string | null;
  title: string | null;
  url: string;
  platform: string;
  full_text: boolean;
  summary_en: { headline?: string; summary?: string; points?: string[] } | null;
  summary_zh: { headline?: string; summary?: string; points?: string[] } | null;
};

export type EditorSuggestion = {
  id: string;
  paragraph: string;
  source_id: string;
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
  social_captions: { zh?: string; en?: string } | null;
  kit_broadcast_id: string | null;
};

export function PostEditor({
  post,
  sources,
  suggestions,
  versions,
}: {
  post: EditorPost;
  sources: EditorSource[];
  suggestions: EditorSuggestion[];
  versions: EditorVersion[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [myTake, setMyTake] = useState(post.my_take);
  const [body, setBody] = useState(post.body);
  const [lang, setLang] = useState(post.body_language);
  const [linkInput, setLinkInput] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [publishMode, setPublishMode] = useState<"web_only" | "web_and_email">("web_only");
  const [confirmEmail, setConfirmEmail] = useState(false);

  const bodyDisplay = useMemo(() => stripSourcesForEditor(body), [body]);

  const socialTitle = encodeURIComponent(title);
  const socialKey = encodeURIComponent(post.key_point ?? "");
  const squareOg = `/api/og/social?title=${socialTitle}&keyPoint=${socialKey}&format=square`;
  const portraitOg = `/api/og/social?title=${socialTitle}&keyPoint=${socialKey}&format=portrait`;

  function run(fn: () => Promise<void>) {
    start(async () => {
      try {
        setMessage(null);
        await fn();
        router.refresh();
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="min-h-screen bg-[var(--karrot-bg)]">
      <header className="sticky top-0 z-20 border-b border-[var(--karrot-border)] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-3 text-sm">
            <Link href="/studio" className="font-semibold">Content Studio</Link>
            <span className="text-[var(--karrot-muted)]">Posts /</span>
            <span className="font-semibold truncate max-w-[200px] sm:max-w-md">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
              {post.status === "published" ? "Published" : "Draft"}
            </span>
            <Link
              href={`/posts/${slug}`}
              className="hidden sm:inline-flex h-9 items-center rounded-lg border border-[var(--karrot-border)] px-3 text-sm font-semibold"
            >
              Preview
            </Link>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  await savePost({
                    id: post.id,
                    title,
                    slug,
                    my_take: myTake,
                    body,
                    body_language: lang,
                    status: post.status,
                    key_point: post.key_point ?? undefined,
                    social_captions: post.social_captions ?? undefined,
                  });
                  setMessage("Saved");
                })
              }
              className="h-9 rounded-lg border border-[var(--karrot-border)] px-3 text-sm font-semibold"
            >
              Save
            </button>
          </div>
        </div>
      </header>

      {message && (
        <p className="mx-auto max-w-[1280px] px-6 pt-3 text-sm text-[var(--karrot-muted)]">{message}</p>
      )}

      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-5 p-6 lg:grid-cols-[300px_minmax(0,1fr)_280px]">
        {/* Sources */}
        <aside className="rounded-2xl border border-[var(--karrot-border)] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--karrot-border)] px-5 py-4">
            <h2 className="text-sm font-semibold">Sources</h2>
            <span className="text-xs text-[var(--karrot-muted)]">{sources.length} attached</span>
          </div>
          <div className="p-5">
            <form
              className="mb-4 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                run(async () => {
                  await addSourceToPost(post.id, linkInput);
                  setLinkInput("");
                  setMessage("Source added");
                });
              }}
            >
              <input
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="Paste X, Threads, or web link"
                className="min-w-0 flex-1 rounded-lg border border-[var(--karrot-border)] px-2.5 py-2 text-sm"
              />
              <button type="submit" className="rounded-lg bg-[var(--karrot-primary)] px-3 text-xs font-semibold text-white">
                +
              </button>
            </form>
            {sources.map((s) => (
              <div key={s.id} className="mb-3 rounded-xl border border-[var(--karrot-border)] p-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-semibold truncate">{s.author ?? s.title ?? "Source"}</span>
                </div>
                <p className="line-clamp-2 text-xs text-[var(--karrot-muted)]">
                  {s.summary_zh?.summary ?? s.summary_en?.summary}
                </p>
                <span
                  className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    s.full_text ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {s.full_text ? "Full article read" : "Opening section only"}
                </span>
                <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                  <div>
                    <p className="mb-1 font-semibold text-[var(--karrot-muted)]">中文</p>
                    <p className="font-medium">{s.summary_zh?.headline}</p>
                    <ul className="mt-1 list-disc pl-4 text-[var(--karrot-muted)]">
                      {(s.summary_zh?.points ?? []).slice(0, 3).map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-1 font-semibold text-[var(--karrot-muted)]">English</p>
                    <p className="font-medium">{s.summary_en?.headline}</p>
                    <ul className="mt-1 list-disc pl-4 text-[var(--karrot-muted)]">
                      {(s.summary_en?.points ?? []).slice(0, 3).map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Editor */}
        <section className="min-h-[640px] rounded-2xl border border-[var(--karrot-border)] bg-white shadow-sm">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border-0 bg-transparent px-6 pt-6 text-2xl font-bold tracking-tight outline-none"
            placeholder="Post title"
          />
          <div className="flex gap-1 border-b border-[var(--karrot-border)] px-6">
            {(["Blog", "Social"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                className="border-b-2 border-transparent px-3 py-2 text-sm font-medium text-[var(--karrot-muted)]"
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="space-y-5 p-6">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--karrot-muted)]">
                My take
              </h3>
              <div className="rounded-xl border border-indigo-200 bg-[var(--karrot-primary-soft)] p-4">
                <textarea
                  value={myTake}
                  onChange={(e) => setMyTake(e.target.value)}
                  rows={4}
                  className="w-full resize-y border-0 bg-transparent text-base leading-relaxed outline-none"
                  placeholder="Your view — AI will never overwrite this."
                />
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--karrot-muted)]">
                Draft from sources
              </h3>
              <textarea
                value={bodyDisplay}
                onChange={(e) => setBody(mergeBodyWithSources(e.target.value, body))}
                rows={14}
                className="w-full rounded-xl border border-[var(--karrot-border)] p-4 text-base leading-relaxed"
              />
            </div>
            {suggestions.map((sug) => (
              <div
                key={sug.id}
                className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 p-4"
              >
                <p className="mb-2 text-xs font-semibold text-indigo-800">Suggested from a new source</p>
                <p className="text-sm leading-relaxed">{sug.paragraph}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-[var(--karrot-primary)] px-3 py-1.5 text-xs font-semibold text-white"
                    onClick={() => run(() => resolveSuggestion(sug.id, "accept"))}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-[var(--karrot-border)] bg-white px-3 py-1.5 text-xs font-semibold"
                    onClick={() => {
                      const edited = window.prompt("Edit before accepting:", sug.paragraph);
                      if (edited) run(() => resolveSuggestion(sug.id, "accept", edited));
                    }}
                  >
                    Edit first
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-[var(--karrot-border)] px-3 py-1.5 text-xs font-semibold"
                    onClick={() => run(() => resolveSuggestion(sug.id, "dismiss"))}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Settings */}
        <aside className="space-y-5">
          <div className="rounded-2xl border border-[var(--karrot-border)] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Post settings</h2>
            <label className="mt-4 block text-xs font-medium text-[var(--karrot-muted)]">
              Body language
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as "zh-HK" | "en")}
                className="mt-1 w-full rounded-lg border border-[var(--karrot-border)] px-2 py-2 text-sm"
              >
                <option value="zh-HK">中文</option>
                <option value="en">English</option>
              </select>
            </label>
            <label className="mt-3 block text-xs font-medium text-[var(--karrot-muted)]">
              URL slug
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--karrot-border)] px-2 py-2 text-sm"
              />
            </label>
            <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-[var(--karrot-muted)]">
              Draft a new section from the attached sources. Your My take and expected edits stay untouched.
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => draftPostWithAi(post.id))}
              className="mt-3 w-full rounded-xl bg-[var(--karrot-primary)] py-2.5 text-sm font-semibold text-white"
            >
              Draft from sources
            </button>
          </div>

          <div className="rounded-2xl border border-[var(--karrot-border)] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Social</h2>
            <p className="mt-2 text-xs text-[var(--karrot-muted)]">Instagram / Facebook captions</p>
            <textarea
              readOnly
              rows={3}
              className="mt-2 w-full rounded-lg border border-[var(--karrot-border)] p-2 text-xs"
              value={post.social_captions?.zh ?? ""}
            />
            <button
              type="button"
              className="mt-1 text-xs font-semibold text-[var(--karrot-primary)]"
              onClick={() => navigator.clipboard.writeText(post.social_captions?.zh ?? "")}
            >
              Copy 中文 caption
            </button>
            <textarea
              readOnly
              rows={3}
              className="mt-3 w-full rounded-lg border border-[var(--karrot-border)] p-2 text-xs"
              value={post.social_captions?.en ?? ""}
            />
            <button
              type="button"
              className="mt-1 text-xs font-semibold text-[var(--karrot-primary)]"
              onClick={() => navigator.clipboard.writeText(post.social_captions?.en ?? "")}
            >
              Copy English caption
            </button>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <a href={squareOg} download="karrot-social-1080.png" className="text-center text-xs font-semibold underline">
                Download 1080×1080
              </a>
              <a href={portraitOg} download="karrot-social-1080x1350.png" className="text-center text-xs font-semibold underline">
                Download 1080×1350
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--karrot-border)] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Publish to Kit</h2>
            <select
              value={publishMode}
              onChange={(e) => setPublishMode(e.target.value as "web_only" | "web_and_email")}
              className="mt-2 w-full rounded-lg border border-[var(--karrot-border)] px-2 py-2 text-sm"
            >
              <option value="web_only">Web only (default)</option>
              <option value="web_and_email">Web and email my list</option>
            </select>
            {publishMode === "web_and_email" && (
              <label className="mt-2 flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.checked)}
                />
                I confirm sending this to my email list
              </label>
            )}
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  await publishPostToKit(post.id, publishMode, confirmEmail);
                  setMessage("Published to Kit");
                })
              }
              className="mt-3 w-full rounded-xl bg-black py-2.5 text-sm font-semibold text-white"
            >
              Publish
            </button>
            {post.kit_broadcast_id && (
              <p className="mt-2 text-xs text-[var(--karrot-muted)]">
                Kit broadcast: {post.kit_broadcast_id}
              </p>
            )}
          </div>

          {versions.length > 0 && (
            <div className="rounded-2xl border border-[var(--karrot-border)] bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold">Versions</h2>
              <ul className="mt-2 space-y-2 text-xs">
                {versions.slice(0, 5).map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">{new Date(v.created_at).toLocaleString()}</span>
                    <button
                      type="button"
                      className="font-semibold text-[var(--karrot-primary)]"
                      onClick={() => run(() => restoreVersion(v.id))}
                    >
                      Restore
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function stripSourcesForEditor(body: string): string {
  return body.replace(/\n## Sources[\s\S]*$/m, "").trim();
}

function mergeBodyWithSources(edited: string, previous: string): string {
  const sourcesPart = previous.match(/\n## Sources[\s\S]*$/m)?.[0] ?? "";
  return `${edited.trim()}${sourcesPart}`;
}
