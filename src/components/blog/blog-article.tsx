import { BlogShare } from "@/components/blog/blog-share";
import { categoryLabel, categoryHref } from "@/lib/blog/categories";
import { AUTHOR_AVATAR_URL, AUTHOR_NAME, BLOG_TAGLINE } from "@/lib/blog/constants";
import {
  formatPostDateUpper,
  postCardExcerpt,
  readTimeLabel,
  stripSourcesSection,
} from "@/lib/blog/format";
import { publicArticleHeadline } from "@/lib/blog/public-posts";
import type { KeyPoint, PublicBlogPost } from "@/lib/blog/types";
import { marked } from "marked";
import Link from "next/link";

marked.setOptions({ gfm: true, breaks: true });

export function BlogArticle({ post }: { post: PublicBlogPost }) {
  const title = publicArticleHeadline(post);
  const shareTitle = post.seo_title?.trim() || title;
  const dek = postCardExcerpt(post);
  const myTake = post.my_take?.trim() ?? "";
  const body = stripSourcesSection(post.body);
  const html = marked.parse(body) as string;
  const lang = post.body_language === "zh-HK" ? "zh-Hant-HK" : "en";
  const keyPoints = (post.key_points ?? []) as KeyPoint[];

  return (
    <article>
      <header className="post-head">
        {post.category && (
          <Link className="chip chip-sm is-active" href={categoryHref(post.category)} lang="en">
            {categoryLabel(post.category)}
          </Link>
        )}
        <h1 className="post-title h-anton" lang={lang}>{title}</h1>
        {dek && <p className="post-dek" lang={lang}>{dek}</p>}
        <div className="post-meta-row" lang="en">
          <div className="author">
            <img src={AUTHOR_AVATAR_URL} alt={AUTHOR_NAME} width={44} height={44} />
            <div>
              <strong>{AUTHOR_NAME}</strong>
              <span>
                {formatPostDateUpper(post.published_at)} · {readTimeLabel(post.read_time)}
              </span>
            </div>
          </div>
          <BlogShare title={shareTitle} slug={post.slug} />
        </div>
      </header>

      {keyPoints.length > 0 && (
        <section className="in-guide post-in-guide" lang={lang} aria-labelledby="post-guide-label">
          <div className="eyebrow" id="post-guide-label">
            In this guide
          </div>
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
        </section>
      )}

      {myTake && (
        <section className="post-my-take" aria-labelledby="post-my-take-label">
          <p className="eyebrow" id="post-my-take-label" lang="en">
            My take
          </p>
          <p className="post-my-take-body" lang={lang}>
            {myTake}
          </p>
        </section>
      )}

      <div className="prose blog-prose" lang={lang} dangerouslySetInnerHTML={{ __html: html }} />

      <div className="post-end" lang="en">
        {post.category ? (
          <div className="chips">
            <span className="muted" style={{ font: "500 13px Roboto,sans-serif", marginRight: 4 }}>
              Filed under
            </span>
            <Link className="chip chip-sm" href={categoryHref(post.category)}>
              {categoryLabel(post.category)}
            </Link>
          </div>
        ) : null}
        <BlogShare title={title} slug={post.slug} />
      </div>

      <div className="author-box" lang="en">
        <img src={AUTHOR_AVATAR_URL} alt="" width={64} height={64} />
        <div>
          <h4 className="h-anton">{AUTHOR_NAME}</h4>
          <p>Karrot Digital · {BLOG_TAGLINE}</p>
        </div>
      </div>
    </article>
  );
}
