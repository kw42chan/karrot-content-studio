"use client";

import { useState } from "react";
import type { EditorSource } from "./post-editor";

export function SourceCard({ source }: { source: EditorSource }) {
  const [expanded, setExpanded] = useState(false);
  const preview = source.text_content?.slice(0, 220) ?? "";
  const hasMore = (source.text_content?.length ?? 0) > 220;

  return (
    <div className="studio-src">
      <div className="studio-src-name">{source.author ?? source.title ?? "Source"}</div>
      <p className="studio-src-oneliner">
        <span className="text-[11px] font-semibold text-[var(--karrot-accent)]">中文</span>{" "}
        {source.summary_zh?.summary}
      </p>
      <p className="studio-src-oneliner">
        <span className="text-[11px] font-semibold text-[var(--karrot-muted)]">EN</span>{" "}
        {source.summary_en?.summary}
      </p>
      {source.text_content && (
        <div className="mt-2 rounded-lg bg-white/80 p-2 text-[11px] leading-relaxed text-[var(--karrot-muted)]">
          <p className="whitespace-pre-wrap">{expanded ? source.text_content : preview}</p>
          {hasMore && (
            <button
              type="button"
              className="mt-1 font-semibold text-[var(--karrot-accent)]"
              onClick={() => setExpanded((e) => !e)}
            >
              {expanded ? "Show less" : "Show full extracted text"}
            </button>
          )}
        </div>
      )}
      <span className={source.full_text ? "studio-badge-full" : "studio-badge-partial"}>
        {source.full_text ? "Full article read" : "Opening section only"}
      </span>
    </div>
  );
}
