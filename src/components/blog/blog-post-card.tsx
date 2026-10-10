import { categoryLabel } from "@/lib/blog/categories";
import {
  formatPostDateUpper,
  postCardExcerpt,
  postDisplayTitle,
  readTimeLabel,
} from "@/lib/blog/format";
import { coverWordForPost } from "@/lib/blog/public-posts";
import type { PublicBlogPost } from "@/lib/blog/types";
import Link from "next/link";

function Cover({ post }: { post: PublicBlogPost }) {
  if (post.cover_url) {
    return (
      <div className="cover" style={{ backgroundImage: `url(${post.cover_url})`, backgroundSize: "cover" }}>
        <span className="cover-word h-anton" />
      </div>
    );
  }
  const coverText = coverWordForPost(post);
  const coverLang = post.body_language === "zh-HK" ? "zh-Hant-HK" : "en";
  return (
    <div className="cover">
      <span className="cover-word h-anton" lang={coverLang} style={{ whiteSpace: "pre-line" }}>
        {coverText}
      </span>
    </div>
  );
}

export function BlogPostCard({
  post,
  previousLabel,
}: {
  post: PublicBlogPost;
  previousLabel?: boolean;
}) {
  const href = `/p/${post.slug}`;
  const meta = `${formatPostDateUpper(post.published_at)} · ${readTimeLabel(post.read_time)}`;

  return (
    <Link className="post-card" href={href}>
      <Cover post={post} />
      <div className="post-card-body">
        <div className="card-top">
          <span className="cat-label">{categoryLabel(post.category)}</span>
          {previousLabel && <span className="sample-tag" style={{ borderStyle: "solid" }}>Previous post</span>}
        </div>
        <h3 className="h-anton" lang={post.body_language === "zh-HK" ? "zh-Hant-HK" : "en"}>
          {postDisplayTitle(post)}
        </h3>
        <p className="dek" lang={post.body_language === "zh-HK" ? "zh-Hant-HK" : "en"}>
          {postCardExcerpt(post)}
        </p>
        <div className="post-meta">{meta}</div>
      </div>
    </Link>
  );
}
