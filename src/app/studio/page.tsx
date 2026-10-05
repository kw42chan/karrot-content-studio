import { createPost } from "@/app/actions/studio";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function StudioHomePage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("studio_posts")
    .select("id, title, slug, status, updated_at")
    .order("updated_at", { ascending: false });

  async function newPost() {
    "use server";
    const id = await createPost();
    redirect(`/studio/posts/${id}`);
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Content Studio</h1>
          <p className="mt-1 text-[var(--karrot-muted)]">Your drafts and published posts.</p>
        </div>
        <form action={newPost}>
          <button
            type="submit"
            className="rounded-full bg-[var(--karrot-primary)] px-4 py-2 text-sm font-semibold text-white"
          >
            New post
          </button>
        </form>
      </div>
      <ul className="mt-8 space-y-3">
        {(posts ?? []).map((p) => (
          <li key={p.id}>
            <Link
              href={`/studio/posts/${p.id}`}
              className="flex items-center justify-between rounded-2xl border border-[var(--karrot-border)] bg-white px-5 py-4 shadow-sm"
            >
              <span className="font-semibold">{p.title}</span>
              <span className="text-xs text-[var(--karrot-muted)]">{p.status}</span>
            </Link>
          </li>
        ))}
        {!posts?.length && (
          <li className="rounded-2xl border border-dashed border-[var(--karrot-border)] p-8 text-center text-[var(--karrot-muted)]">
            No posts yet. Create your first draft.
          </li>
        )}
      </ul>
    </main>
  );
}
