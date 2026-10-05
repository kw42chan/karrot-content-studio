import { getBookingUrl } from "@/lib/env";
import { marked } from "marked";
import Link from "next/link";

marked.setOptions({ gfm: true, breaks: true });

export type PublicPost = {
  title: string;
  slug: string;
  my_take: string;
  body: string;
  published_at: string | null;
  body_language: string;
};

export type PublicSource = {
  author: string | null;
  title: string | null;
  url: string;
  platform: string;
};

export function PublicPostView({
  post,
  sources,
}: {
  post: PublicPost;
  sources: PublicSource[];
}) {
  const bodyWithoutSources = post.body.replace(/\n## Sources[\s\S]*$/m, "").trim();
  const bodyHtml = marked.parse(bodyWithoutSources) as string;
  const booking = getBookingUrl();

  return (
    <div className="mx-auto max-w-[1440px] px-3 py-6 sm:px-6">
      <div className="relative overflow-hidden rounded-[32px] bg-[var(--karrot-header)] px-6 py-12 text-[var(--karrot-bg)] sm:px-24 sm:pb-24">
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/posts" className="rounded-full border border-white/70 px-3 py-2 text-sm">
            ←
          </Link>
          <span className="text-xs font-semibold tracking-widest uppercase opacity-90">Share</span>
        </div>
        <p className="relative z-10 mt-16 text-xs font-semibold tracking-widest uppercase">
          {post.published_at
            ? new Date(post.published_at).toLocaleDateString()
            : "Just now"}{" "}
          · 4 min read
        </p>
        <h1 className="relative z-10 mt-4 max-w-3xl font-display text-4xl leading-tight sm:text-6xl">
          {post.title}
        </h1>
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl gap-10 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-3xl bg-[var(--karrot-card)] p-6">
          <div className="h-16 w-16 rounded-full bg-[var(--karrot-header)]" />
          <p className="mt-4 font-display text-2xl">Darwin Chan</p>
          <p className="text-sm text-[#373f45]">Automating Business with Intelligent Tech</p>
        </aside>

        <article className="max-w-2xl text-lg leading-relaxed">
          {post.my_take && (
            <section className="mb-8 rounded-3xl border-l-4 border-[var(--karrot-accent)] bg-[var(--karrot-card)] p-6">
              <p className="text-xs font-bold tracking-wide text-[var(--karrot-accent)]">My take</p>
              <p className="mt-2">{post.my_take}</p>
            </section>
          )}
          <div
            className="prose prose-lg max-w-none prose-headings:font-display"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
          {sources.length > 0 && (
            <section className="mt-10 rounded-3xl bg-[var(--karrot-card)] p-6">
              <h2 className="font-display text-2xl">Sources</h2>
              <div className="mt-4 space-y-3">
                {sources.map((s) => (
                  <div key={s.url} className="rounded-2xl bg-white p-4">
                    <h3 className="font-semibold">{s.author ?? s.title}</h3>
                    <p className="text-sm text-[#373f45]">
                      {s.platform === "x" ? "X / long-form article" : s.platform}
                    </p>
                    <a href={s.url} className="mt-2 block text-sm text-[var(--karrot-accent)]">
                      {s.url}
                    </a>
                  </div>
                ))}
              </div>
            </section>
          )}
          <section className="mt-10 rounded-3xl bg-black p-8 text-[var(--karrot-bg)]">
            <h2 className="font-display text-3xl">Talk to me about AI consultancy</h2>
            <p className="mt-3 text-base opacity-90">
              I help businesses automate with intelligent tech — without the lockouts, dead ends, and
              half-finished AI experiments.
            </p>
            <a
              href={booking}
              className="mt-6 inline-block rounded-full bg-[var(--karrot-accent)] px-6 py-3 text-sm font-semibold text-white"
            >
              Book a conversation
            </a>
          </section>
        </article>
      </div>
    </div>
  );
}
