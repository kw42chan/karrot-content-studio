/** Static layout preview (no DB) for design QA — mirrors the studio editor shell. */
export default function DemoCmsPage() {
  return (
    <div className="min-h-screen bg-[var(--karrot-bg)]">
      <header className="sticky top-0 z-20 border-b border-[var(--karrot-border)] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-6">
          <div className="text-sm font-semibold">Content Studio · Posts / Claude 封號：香港創作者的共用對策</div>
          <div className="flex gap-2 text-sm">
            <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">Draft</span>
            <span className="rounded-lg border px-3 py-1.5 font-semibold">Save</span>
            <span className="rounded-lg bg-[var(--karrot-primary)] px-3 py-1.5 font-semibold text-white">Publish</span>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-5 p-6 lg:grid-cols-[300px_minmax(0,1fr)_280px]">
        <aside className="rounded-2xl border bg-white p-5">
          <h2 className="text-sm font-semibold">Sources · 3 attached</h2>
          <div className="mt-4 space-y-3">
            {["MagicPower", "AYi", "BrewBytes"].map((name, i) => (
              <div key={name} className="rounded-xl border p-3 text-sm">
                <p className="font-semibold">{name}</p>
                <span
                  className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    i < 2 ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {i < 2 ? "Full article read" : "Opening section only"}
                </span>
              </div>
            ))}
          </div>
        </aside>
        <section className="rounded-2xl border bg-white p-6">
          <h1 className="text-2xl font-bold">Claude 封號：香港創作者的共用對策</h1>
          <div className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
            <p className="text-xs font-semibold uppercase text-[var(--karrot-muted)]">My take</p>
            <p className="mt-2 text-sm leading-relaxed">
              香港用 Claude 唔係「換個 VPN」就搞掂。網絡、裝置、付款要當一套系統睇。
            </p>
          </div>
          <p className="mt-4 text-sm text-[var(--karrot-muted)]">Draft from sources…</p>
        </section>
        <aside className="rounded-2xl border bg-white p-5 text-sm">
          <p className="font-semibold">Draft from sources</p>
          <button type="button" className="mt-3 w-full rounded-xl bg-[var(--karrot-primary)] py-2 text-white font-semibold">
            Draft from sources
          </button>
        </aside>
      </div>
    </div>
  );
}
