import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-start justify-center gap-6 px-6">
      <h1 className="font-display text-4xl leading-tight">Karrot Content Studio</h1>
      <p className="text-lg text-[var(--karrot-muted)]">
        Turn source links into bilingual summaries and blog posts for{" "}
        <a href="https://karrotdigital.com" className="text-[var(--karrot-accent)] underline">
          karrotdigital.com
        </a>
        .
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/login"
          className="btn-primary px-5 py-2.5"
        >
          Sign in
        </Link>
        <Link
          href="/posts"
          className="rounded-full border border-[var(--karrot-border)] bg-white px-5 py-2.5 text-sm font-semibold"
        >
          Published posts
        </Link>
      </div>
    </main>
  );
}
