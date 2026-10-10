import { BlogArticle } from "@/components/blog/blog-article";
import { BlogFooter } from "@/components/blog/blog-footer";
import { BlogNav } from "@/components/blog/blog-nav";
import type { PublicBlogPost } from "@/lib/blog/types";
import { createClient } from "@/lib/supabase/server";
import { Noto_Sans_TC } from "next/font/google";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@/styles/blog.css";

const noto = Noto_Sans_TC({
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
  variable: "--font-noto-tc",
  display: "swap",
});

export const dynamic = "force-dynamic";

const POST_SELECT =
  "id, title, slug, seo_title, meta_description, excerpt, my_take, body, body_language, published_at, category, read_time, cover_url, key_points, status";

export default async function AdminPostPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  await supabase.auth.getUser();

  const { data: post } = await supabase
    .from("studio_posts")
    .select(POST_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (!post) notFound();

  return (
    <div className={`blog-root ${noto.variable}`}>
      <BlogNav />
      <div className="page">
        <div className="container">
          <p className="crumbs" style={{ marginBottom: 8 }} lang="en">
            <Link href={`/studio/posts/${id}`}>← Back to editor</Link>
            <span className="sep"> · </span>
            <span className="current">
              {post.status === "published" ? "Preview" : "Draft preview (not on public /p yet)"}
            </span>
          </p>
          <BlogArticle post={post as PublicBlogPost} />
        </div>
        <BlogFooter />
      </div>
    </div>
  );
}
