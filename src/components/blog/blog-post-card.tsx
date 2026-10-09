import { categoryLabel } from "@/lib/blog/categories";
import {
  formatPostDateUpper,
  postCardExcerpt,
  postDisplayTitle,
  readTimeLabel,
} from "@/lib/blog/format";
import type { PublicBlogPost } from "@/lib/blog/types";
import type { SamplePostCard } from "@/lib/blog/sample-posts";
import Link from "next/link";

function Cover({ post, sample }: { post?: PublicBlogPost; sample?: SamplePostCard }) {
  if (sample) {
    return (
      <div className="cover sample">
        <span>Sample cover</span>
      </div>
    );
  }
  if (post?.cover_url) {
    return (
      <div className="cover" style={{ backgroundImage: `url(${post.cover_url})`, backgroundSize: "cover" }}>
        <span className="cover-word h-anton" />
      </div>
    );
  }
  const words = postDisplayTitle(post!).split(/\s+/).slice(0, 2);
  const coverText =
    post!.body_language === "zh-HK"
      ? post!.title.slice(0, 6)
      : words.join(" ");
  return (
    <div className="cover">
      <span className="cover-word h-anton" lang={post!.body_language === "zh-HK" ? "zh-Hant-HK" : "en"}>
        {coverText}
      </span>
    </div>
  );
}

export function BlogPostCard({
  post,
  sample,
  previousLabel,
}: {
  post?: PublicBlogPost;
  sample?: SamplePostCard;
  previousLabel?: boolean;
}) {
  if (sample) {
    return (
      <div className="post-card is-sample">
        <Cover sample={sample} />
        <div className="post-card-body">
          <div className="card-top">
            <span className="cat-label">{categoryLabel(sample.category)}</span>
            <span className="sample-tag">Sample</span>
          </div>
          <h3 className="h-anton">{sample.title}</h3>
          <p className="dek">{sample.excerpt}</p>
          <div className="post-meta">{sample.dateLabel} · {readTimeLabel(sample.readTime)}</div>
        </div>
      </div>
    );
  }

  if (!post) return null;
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
