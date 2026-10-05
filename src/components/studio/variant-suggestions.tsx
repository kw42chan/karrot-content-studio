"use client";

import type { EditorSuggestion } from "./post-editor";

export function VariantSuggestions({
  suggestions,
  demoMode,
  onAccept,
  onEdit,
  onDismiss,
}: {
  suggestions: EditorSuggestion[];
  demoMode: boolean;
  onAccept: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onDismiss: (id: string) => void;
}) {
  if (!suggestions.length) return null;
  return (
    <>
      {suggestions.map((sug) => (
        <div key={sug.id} className="studio-suggest">
          <p className="mb-2 text-xs font-semibold text-[var(--karrot-accent)]">
            {sug.label ?? "Suggestion"}
          </p>
          <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--karrot-muted)]">
            {sug.paragraph}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="studio-btn studio-btn-primary h-8 px-3 text-xs"
              onClick={() => onAccept(sug.id)}
            >
              Accept
            </button>
            <button
              type="button"
              className="studio-btn studio-btn-ghost h-8 px-3 text-xs"
              onClick={() => {
                const edited = window.prompt("Edit before accepting:", sug.paragraph);
                if (edited) onEdit(sug.id, edited);
              }}
            >
              Edit first
            </button>
            <button
              type="button"
              className="studio-btn studio-btn-ghost h-8 px-3 text-xs"
              onClick={() => onDismiss(sug.id)}
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
