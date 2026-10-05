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

const AVATAR =
  "https://embed.filekitcdn.com/e/qZ375j2sBMyZfkkw6tSqH2/oJsbTGL9j6tMWN6r6KwcBW";

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
      <div className="relative overflow-hidden rounded-[32px] bg-[var(--karrot-header)] px-6 py-10 text-[var(--karrot-bg)] sm:px-16 sm:pb-20 sm:pt-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            background:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 140'%3E%3Cpath fill='%23FBF3EB' d='M20 10h28v48l36-48h34L70 68l30 62H84L54 78v52H20V10z'/%3E%3C/svg%3E\") right -40px center / 380px no-repeat",
          }}
        />
        <div className="relative z-10 flex items-center justify-between">
          <Link
            href="/posts"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70"
          >
            ←
          </Link>
          <span className="text-xs font-semibold tracking-[0.1em] uppercase">Share</span>
        </div>
        <p className="relative z-10 mt-12 text-xs font-semibold tracking-[0.1em] uppercase sm:mt-16">
          {post.published_at
            ? new Date(post.published_at).toLocaleDateString()
            : "Just now"}{" "}
          · 4 min read
        </p>
        <h1 className="relative z-10 mt-4 max-w-4xl font-display text-[clamp(2rem,5vw,4rem)] leading-[1.05]">
          {post.title}
        </h1>
      </div>

      <div className="mx-auto mt-10 flex max-w-6xl flex-col gap-10 lg:flex-row lg:items-start lg:gap-16">
        <aside className="w-full shrink-0 lg:sticky lg:top-8 lg:w-[296px]">
          <div className="rounded-3xl bg-[var(--karrot-card)] p-6">
            <img
              src={AVATAR}
              alt="Darwin Chan"
              width={80}
              height={80}
              className="h-20 w-20 rounded-full object-cover"
            />
            <p className="mt-4 font-display text-3xl leading-tight">Darwin Chan</p>
            <p className="mt-1 text-base text-[#373f45]">
              Automating Business with Intelligent Tech
            </p>
            <div className="mt-5 flex gap-2">
              <input
                type="email"
                placeholder="Email address"
                readOnly
                className="min-w-0 flex-1 rounded-full border-0 bg-white px-4 py-2.5 text-sm"
              />
              <span className="rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white">
                Subscribe
              </span>
            </div>
          </div>
        </aside>

        <article className="min-w-0 flex-1">
          {post.my_take && (
            <section className="mb-10 rounded-3xl bg-[var(--karrot-card)] p-6 sm:p-8">
              <p className="text-xs font-bold tracking-[0.08em] text-[var(--karrot-accent)]">
                MY TAKE
              </p>
              <p className="mt-3 text-lg leading-relaxed">{post.my_take}</p>
            </section>
          )}
          <div className="karrot-article" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
          {sources.length > 0 && (
            <section className="mt-12 rounded-3xl bg-[var(--karrot-card)] p-6 sm:p-8">
              <h2 className="font-display text-2xl">Sources</h2>
              <div className="mt-5 space-y-3">
                {sources.map((s) => (
                  <div key={s.url} className="rounded-2xl bg-white p-4">
                    <h3 className="text-lg font-semibold">{s.author ?? s.title}</h3>
                    <p className="text-sm text-[#373f45]">
                      {s.platform === "x"
                        ? "X / long-form article"
                        : s.platform === "threads"
                          ? "Threads"
                          : "Web"}
                    </p>
                    {s.title && s.author && (
                      <p className="mt-1 text-sm">{s.title}</p>
                    )}
                    <a
                      href={s.url}
                      className="mt-2 inline-block text-sm font-medium text-[var(--karrot-accent)] underline-offset-2 hover:underline"
                    >
                      {s.url}
                    </a>
                  </div>
                ))}
              </div>
            </section>
          )}
          <section className="mt-12 rounded-3xl bg-black p-8 text-[var(--karrot-bg)] sm:p-10">
            <h2 className="font-display text-3xl leading-tight">
              Talk to me about AI consultancy
            </h2>
            <p className="mt-4 text-lg leading-relaxed opacity-95">
              I help businesses automate with intelligent tech — without the lockouts, dead ends, and
              half-finished AI experiments.
            </p>
            <a
              href={booking}
              className="mt-8 inline-block rounded-full bg-[var(--karrot-accent)] px-8 py-3.5 text-base font-semibold text-white"
            >
              Book a conversation
            </a>
          </section>
        </article>
      </div>
    </div>
  );
}
