import { DEMO_SOURCES } from "@/lib/demo/content";

export default function DemoSourceCardPage() {
  const s = DEMO_SOURCES[0];
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--karrot-bg)] p-8">
      <div className="studio-src w-full max-w-md bg-white p-4 shadow-sm">
        <div className="studio-src-name">{s.author}</div>
        <p className="studio-src-oneliner">
          <span className="text-[11px] font-semibold text-[var(--karrot-accent)]">中文</span>{" "}
          {s.summary_zh?.summary}
        </p>
        <p className="studio-src-oneliner">
          <span className="text-[11px] font-semibold text-[var(--karrot-muted)]">EN</span>{" "}
          {s.summary_en?.summary}
        </p>
        <span className="studio-badge-full">Full article read</span>
      </div>
    </main>
  );
}
