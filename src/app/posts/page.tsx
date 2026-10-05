import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function PostsIndexPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("studio_posts")
    .select("title, slug, published_at, my_take")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-12">
      <h1 className="font-display text-4xl">Karrot Digital — Posts</h1>
      <p className="mt-2 text-[var(--karrot-muted)]">
        Public preview.{" "}
        <Link href="/studio" className="font-semibold text-[var(--karrot-accent)]">Content Studio</Link>
        {" · "}
        <a href="https://karrotdigital.com" className="underline">karrotdigital.com</a>
      </p>
      <ul className="mt-8 space-y-4">
        {(posts ?? []).map((p) => (
          <li key={p.slug}>
            <Link href={`/posts/${p.slug}`} className="block rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold">{p.title}</h2>
              {p.published_at && (
                <p className="mt-1 text-sm text-[var(--karrot-muted)]">
                  {new Date(p.published_at).toLocaleDateString()}
                </p>
              )}
            </Link>
          </li>
        ))}
        {!posts?.length && (
          <li className="text-[var(--karrot-muted)]">No published posts yet.</li>
        )}
      </ul>
    </main>
  );
}
