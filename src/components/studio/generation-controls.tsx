"use client";

import type { DistributionChannel } from "@/lib/studio/channels";
import type { ChannelGenerationPrefs } from "@/lib/studio/generation-prefs";

export function GenerationControls({
  channel,
  prefs,
  onChange,
  disabled,
}: {
  channel: DistributionChannel;
  prefs: ChannelGenerationPrefs;
  onChange: (next: ChannelGenerationPrefs) => void;
  disabled?: boolean;
}) {
  if (channel === "blog") {
    return (
      <div className="studio-gen-controls">
        <div className="studio-field">
          <label>Length / depth</label>
          <select
            value={prefs.blog.length}
            disabled={disabled}
            onChange={(e) =>
              onChange({
                ...prefs,
                blog: { ...prefs.blog, length: e.target.value as ChannelGenerationPrefs["blog"]["length"] },
              })
            }
          >
            <option value="short">Short (~300 words)</option>
            <option value="standard">Standard (~700 words)</option>
            <option value="indepth">In-depth (1,500+ words)</option>
          </select>
        </div>
        <div className="studio-field">
          <label>Coverage</label>
          <select
            value={prefs.blog.coverage}
            disabled={disabled}
            onChange={(e) =>
              onChange({
                ...prefs,
                blog: {
                  ...prefs.blog,
                  coverage: e.target.value as ChannelGenerationPrefs["blog"]["coverage"],
                },
              })
            }
          >
            <option value="summarize">Summarize</option>
            <option value="follow_sources">Follow sources closely</option>
          </select>
        </div>
      </div>
    );
  }

  if (channel === "x") {
    return (
      <div className="studio-gen-controls">
        <div className="studio-field">
          <label>Length / depth</label>
          <select
            value={prefs.x.mode}
            disabled={disabled}
            onChange={(e) =>
              onChange({
                ...prefs,
                x: { mode: e.target.value as ChannelGenerationPrefs["x"]["mode"] },
              })
            }
          >
            <option value="single">Single post</option>
            <option value="thread_3">Thread · 3 parts</option>
            <option value="thread_5">Thread · 5 parts</option>
            <option value="thread_8">Thread · 8 parts</option>
          </select>
        </div>
      </div>
    );
  }

  if (channel === "threads") {
    return (
      <div className="studio-gen-controls">
        <div className="studio-field">
          <label>Length / depth</label>
          <select
            value={prefs.threads.length}
            disabled={disabled}
            onChange={(e) =>
              onChange({
                ...prefs,
                threads: {
                  length: e.target.value as ChannelGenerationPrefs["threads"]["length"],
                },
              })
            }
          >
            <option value="short">Short (under 200 chars)</option>
            <option value="full">Full (up to 500 chars)</option>
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="studio-gen-controls">
      <div className="studio-field">
        <label>Caption length</label>
        <select
          value={prefs.instagram.length}
          disabled={disabled}
          onChange={(e) =>
            onChange({
              ...prefs,
              instagram: {
                length: e.target.value as ChannelGenerationPrefs["instagram"]["length"],
              },
            })
          }
        >
          <option value="short">Short (~80 words)</option>
          <option value="medium">Medium (~150 words)</option>
          <option value="long">Long (~300 words)</option>
        </select>
      </div>
    </div>
  );
}

export function VariantQuickActions({
  onAdjust,
  disabled,
}: {
  onAdjust: (adjust: "shorter" | "longer" | "more_detail") => void;
  disabled?: boolean;
}) {
  return (
    <div className="studio-quick-actions">
      <span className="studio-quick-label">Quick actions</span>
      <div className="studio-quick-btns">
        <button type="button" className="studio-btn studio-btn-ghost h-8 text-xs" disabled={disabled} onClick={() => onAdjust("shorter")}>
          Make shorter
        </button>
        <button type="button" className="studio-btn studio-btn-ghost h-8 text-xs" disabled={disabled} onClick={() => onAdjust("longer")}>
          Make longer
        </button>
        <button
          type="button"
          className="studio-btn studio-btn-ghost h-8 text-xs"
          disabled={disabled}
          onClick={() => onAdjust("more_detail")}
        >
          Add more detail from sources
        </button>
      </div>
    </div>
  );
}
