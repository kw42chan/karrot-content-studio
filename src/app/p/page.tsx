import { isDraftPlaceholderSlug } from "@/lib/posts/site-publish";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PublicSiteIndexPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("studio_posts")
    .select("title, slug, published_at, meta_description, seo_title")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const visible = (posts ?? []).filter((p) => !isDraftPlaceholderSlug(p.slug));

  return (
    <main className="min-h-screen bg-[var(--karrot-bg)] px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold text-[var(--karrot-accent)]">Karrot Digital</p>
        <h1 className="mt-2 font-display text-4xl">Posts</h1>
        <p className="mt-2 text-[var(--karrot-muted)]">Published from Content Studio.</p>
        <ul className="mt-10 space-y-4">
          {visible.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/p/${p.slug}`}
                className="block rounded-2xl border border-[var(--karrot-border)] bg-white p-5 shadow-sm transition hover:border-[var(--karrot-accent)]"
              >
                <h2 className="text-xl font-semibold">{p.seo_title || p.title}</h2>
                {p.meta_description && (
                  <p className="mt-2 text-sm text-[var(--karrot-muted)] line-clamp-2">
                    {p.meta_description}
                  </p>
                )}
                {p.published_at && (
                  <p className="mt-2 text-xs text-[var(--karrot-muted)]">
                    {new Date(p.published_at).toLocaleDateString()}
                  </p>
                )}
              </Link>
            </li>
          ))}
          {!visible.length && (
            <li className="text-[var(--karrot-muted)]">No published posts yet.</li>
          )}
        </ul>

        <section id="book" className="mt-12 rounded-3xl bg-[var(--karrot-card)] p-6 sm:p-8">
          <h2 className="font-display text-3xl">Book a conversation</h2>
          <p className="mt-3 text-[var(--karrot-muted)]">
            Email Darwin about AI or automation work for your business. A calendar link will replace
            this when ready.
          </p>
          <a
            className="mt-5 inline-block rounded-full bg-[var(--karrot-accent)] px-5 py-3 font-semibold text-white"
            href="mailto:darwin.chankawing@gmail.com?subject=Book%20a%20conversation%20%E2%80%94%20Karrot%20Digital"
          >
            Email Darwin
          </a>
          <p className="mt-3 text-sm">
            <a className="text-[var(--karrot-accent)]" href="mailto:darwin.chankawing@gmail.com">
              darwin.chankawing@gmail.com
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
