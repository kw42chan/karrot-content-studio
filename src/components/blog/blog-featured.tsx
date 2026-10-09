import { categoryLabel } from "@/lib/blog/categories";
import { AUTHOR_AVATAR_URL, AUTHOR_NAME } from "@/lib/blog/constants";
import {
  formatPostDateUpper,
  postCardExcerpt,
  postDisplayTitle,
  readTimeLabel,
} from "@/lib/blog/format";
import type { KeyPoint, PublicBlogPost } from "@/lib/blog/types";
import Link from "next/link";

export function BlogFeatured({ post }: { post: PublicBlogPost }) {
  const keyPoints = (post.key_points ?? []) as KeyPoint[];
  const showGuide = keyPoints.length > 0;

  return (
    <Link className="featured" href={`/p/${post.slug}`} aria-label={`Read: ${postDisplayTitle(post)}`}>
      <div className="watermark" aria-hidden="true" />
      <div className="featured-main">
        <div className="featured-tags">
          <span className="tag-latest">Latest post</span>
          {post.category && <span className="tag-cat">{categoryLabel(post.category)}</span>}
        </div>
        <h2 className="h-anton" lang={post.body_language === "zh-HK" ? "zh-Hant-HK" : "en"}>
          {postDisplayTitle(post)}
        </h2>
        <p className="fdek" lang={post.body_language === "zh-HK" ? "zh-Hant-HK" : "en"}>
          {postCardExcerpt(post)}
        </p>
        <div className="fmeta">
          <img src={AUTHOR_AVATAR_URL} alt="" width={28} height={28} />
          {AUTHOR_NAME} · {formatPostDateUpper(post.published_at)} · {readTimeLabel(post.read_time)}
        </div>
        <span className="btn btn-cream">Read the guide →</span>
      </div>
      {showGuide && (
        <div className="in-guide" lang={post.body_language === "zh-HK" ? "zh-Hant-HK" : "en"}>
          <div className="eyebrow">In this guide</div>
          <ol>
            {keyPoints.slice(0, 5).map((kp, i) => (
              <li key={i}>
                <span className="n">{String(i + 1).padStart(2, "0")}</span>
                <span>
                  {kp.title}
                  {kp.subtitle ? <small>{kp.subtitle}</small> : null}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </Link>
  );
}
