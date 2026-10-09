"use client";

import { GenerationControls } from "@/components/studio/generation-controls";
import type { ContentLocale, DistributionChannel } from "@/lib/studio/channels";
import type { EditorPost, EditorVersion } from "@/components/studio/post-editor";
import { POST_CATEGORIES, categoryLabel, type PostCategory } from "@/lib/blog/categories";
import type { ChannelGenerationPrefs } from "@/lib/studio/generation-prefs";

export function ChannelSettingsPanel({
  channel,
  locale,
  post,
  slug,
  setSlug,
  seoTitle,
  setSeoTitle,
  metaDescription,
  setMetaDescription,
  category,
  setCategory,
  onFillSeo,
  seoFilling = false,
  publishMode,
  setPublishMode,
  confirmEmail,
  setConfirmEmail,
  xChars,
  threadsChars,
  threadParts,
  onAddThreadPart,
  onUpdateThreadPart,
  igAspect,
  setIgAspect,
  squareOg,
  portraitOg,
  onDownloadOg,
  demoMode,
  pending,
  onDraftFromSources,
  generationPrefs,
  onGenerationPrefsChange,
  versions,
  onRestoreVersion,
  onDeletePost,
  deletePending = false,
}: {
  channel: DistributionChannel;
  locale: ContentLocale;
  post: EditorPost;
  slug: string;
  setSlug: (v: string) => void;
  seoTitle: string;
  setSeoTitle: (v: string) => void;
  metaDescription: string;
  setMetaDescription: (v: string) => void;
  category: PostCategory | "";
  setCategory: (v: PostCategory | "") => void;
  onFillSeo?: () => void;
  seoFilling?: boolean;
  publishMode: "web_only" | "web_and_email";
  setPublishMode: (v: "web_only" | "web_and_email") => void;
  confirmEmail: boolean;
  setConfirmEmail: (v: boolean) => void;
  xChars: number;
  threadsChars: number;
  threadParts: string[];
  onAddThreadPart: () => void;
  onUpdateThreadPart: (i: number, v: string) => void;
  igAspect: "square" | "portrait";
  setIgAspect: (v: "square" | "portrait") => void;
  squareOg: string;
  portraitOg: string;
  onDownloadOg: (url: string, name: string) => void;
  demoMode: boolean;
  pending: boolean;
  onDraftFromSources: () => void;
  generationPrefs: ChannelGenerationPrefs;
  onGenerationPrefsChange: (prefs: ChannelGenerationPrefs) => void;
  versions: EditorVersion[];
  onRestoreVersion: (id: string) => void;
  onDeletePost?: () => void;
  deletePending?: boolean;
}) {
  const channelLabel =
    channel === "blog"
      ? "Blog"
      : channel === "x"
        ? "X"
        : channel === "threads"
          ? "Threads"
          : "Instagram";

  return (
    <aside className="studio-panel studio-aside-settings studio-mobile-panel-settings">
      <div className="studio-panel-h">
        <span>{channel === "blog" ? "Blog settings" : `${channelLabel} settings`}</span>
        <span className="channel-tag">{channelLabel}</span>
      </div>
      <div className="studio-panel-b flex flex-col gap-4">
        {channel === "blog" && (
          <>
            <div className="studio-field">
              <label>Slug</label>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} readOnly={demoMode} />
            </div>
            <div className="studio-field">
              <label>SEO title</label>
              <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} readOnly={demoMode} />
            </div>
            <div className="studio-field">
              <label>Meta description</label>
              <textarea
                className="studio-textarea"
                rows={3}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                readOnly={demoMode}
              />
            </div>
            <div className="studio-field">
              <label>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PostCategory | "")}
                disabled={demoMode}
                className="w-full rounded-lg border border-[var(--karrot-border)] bg-white px-3 py-2 text-sm"
              >
                <option value="">— Select —</option>
                {POST_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{categoryLabel(c)}</option>
                ))}
              </select>
            </div>
            {onFillSeo && (
              <button
                type="button"
                className="studio-btn studio-btn-ghost h-8 text-xs"
                onClick={onFillSeo}
                disabled={demoMode || seoFilling}
                aria-busy={seoFilling}
              >
                {seoFilling ? "Filling SEO…" : "Fill SEO"}
              </button>
            )}
            <div className="studio-field">
              <label>Publish to</label>
              <div className="studio-seg-row">
                <button
                  type="button"
                  className={`studio-chip ${publishMode === "web_only" ? "on" : ""}`}
                  onClick={() => setPublishMode("web_only")}
                >
                  Public blog (/p)
                </button>
                <button
                  type="button"
                  className={`studio-chip ${publishMode === "web_and_email" ? "on" : ""}`}
                  onClick={() => setPublishMode("web_and_email")}
                  title="Kit email publishing is unchanged in code but not used by the Publish button"
                >
                  Kit email (legacy)
                </button>
              </div>
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
          </>
        )}

        {channel === "x" && (
          <>
            <p className={`text-sm font-semibold ${xChars > 280 ? "text-red-700" : ""}`}>
              {xChars} / 280 characters
            </p>
            <div>
              <p className="mb-2 text-xs font-semibold text-[var(--karrot-muted)]">Thread builder (optional)</p>
              {threadParts.map((part, i) => (
                <textarea
                  key={i}
                  className="mb-2 w-full rounded-lg border border-[var(--karrot-border)] p-2 text-sm"
                  rows={2}
                  value={part}
                  onChange={(e) => onUpdateThreadPart(i, e.target.value)}
                />
              ))}
              <button type="button" className="studio-btn studio-btn-ghost h-8 text-xs" onClick={onAddThreadPart}>
                Add thread tweet
              </button>
            </div>
          </>
        )}

        {channel === "threads" && (
          <p className={`text-sm font-semibold ${threadsChars > 500 ? "text-red-700" : ""}`}>
            {threadsChars} / 500 characters
          </p>
        )}

        {channel === "instagram" && (
          <>
            <div className="studio-field">
              <label>Aspect</label>
              <div className="studio-seg-row">
                <button
                  type="button"
                  className={`studio-chip ${igAspect === "square" ? "on" : ""}`}
                  onClick={() => setIgAspect("square")}
                >
                  1080×1080
                </button>
                <button
                  type="button"
                  className={`studio-chip ${igAspect === "portrait" ? "on" : ""}`}
                  onClick={() => setIgAspect("portrait")}
                >
                  1080×1350
                </button>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border border-[var(--karrot-border)]">
              <img src={igAspect === "square" ? squareOg : portraitOg} alt="OG preview" className="w-full" />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="studio-btn studio-btn-ghost h-8 text-xs"
                onClick={() => onDownloadOg(squareOg, "og-square.png")}
              >
                Download square
              </button>
              <button
                type="button"
                className="studio-btn studio-btn-ghost h-8 text-xs"
                onClick={() => onDownloadOg(portraitOg, "og-portrait.png")}
              >
                Download portrait
              </button>
            </div>
            <p className="text-xs text-[var(--karrot-muted)]">
              Caption language: {locale === "zh-HK" ? "中文" : "English"}
            </p>
          </>
        )}

        <div className="studio-ai-box">
          <GenerationControls
            channel={channel}
            prefs={generationPrefs}
            onChange={onGenerationPrefsChange}
            disabled={demoMode}
          />
          <p className="mt-3">
            Draft for <strong>{channelLabel}</strong> ({locale === "zh-HK" ? "中文" : "English"}) from attached
            sources. My take is never changed automatically.
          </p>
          <button
            type="button"
            disabled={pending || demoMode}
            className="studio-btn studio-btn-primary"
            onClick={onDraftFromSources}
          >
            Draft from sources
          </button>
        </div>

        {channel === "blog" && versions.length > 0 && !demoMode && (
          <div>
            <p className="mb-2 text-xs font-semibold">Blog versions</p>
            <ul className="space-y-2 text-xs">
              {versions.slice(0, 5).map((v) => (
                <li key={v.id} className="flex justify-between gap-2">
                  <span className="truncate">{new Date(v.created_at).toLocaleString()}</span>
                  <button
                    type="button"
                    className="font-semibold text-[var(--karrot-accent)]"
                    onClick={() => onRestoreVersion(v.id)}
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

        {onDeletePost && (
          <div className="studio-danger-zone">
            <p className="text-xs text-[var(--karrot-muted)]">
              Permanently removes this post from the studio and public blog.
            </p>
            <button
              type="button"
              className="studio-btn studio-btn-danger w-full"
              disabled={deletePending || demoMode}
              onClick={onDeletePost}
            >
              {deletePending ? "Deleting…" : "Delete post"}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
