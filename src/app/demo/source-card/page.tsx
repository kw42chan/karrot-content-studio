export default function DemoSourceCardPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--karrot-bg)] p-8">
      <div className="w-full max-w-sm rounded-xl border border-[var(--karrot-border)] bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold">MagicPower · X</p>
        <p className="mt-2 text-sm text-[var(--karrot-muted)]">
          作者在被封號六次後，透過搭建搬瓦工VPS加AT&T美國住宅IP的雙層網絡，成功避免再被封號。
        </p>
        <span className="mt-3 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
          Full article read
        </span>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 text-xs">
          <div>
            <p className="font-semibold text-[var(--karrot-muted)]">中文</p>
            <p className="mt-1 font-medium">連續六次被Claude封號後的最終解決方案</p>
          </div>
          <div>
            <p className="font-semibold text-[var(--karrot-muted)]">English</p>
            <p className="mt-1 font-medium">how to avoid claude account bans with a dual-layer network setup</p>
          </div>
        </div>
      </div>
    </main>
  );
}
