import { BlogShare } from "@/components/blog/blog-share";
import { categoryLabel, categoryHref } from "@/lib/blog/categories";
import { AUTHOR_AVATAR_URL, AUTHOR_NAME, BLOG_TAGLINE } from "@/lib/blog/constants";
import {
  formatPostDateUpper,
  postCardExcerpt,
  postDisplayTitle,
  readTimeLabel,
  stripSourcesSection,
} from "@/lib/blog/format";
import type { PublicBlogPost } from "@/lib/blog/types";
import { marked } from "marked";
import Link from "next/link";

marked.setOptions({ gfm: true, breaks: true });

export function BlogArticle({ post }: { post: PublicBlogPost }) {
  const title = postDisplayTitle(post);
  const dek = postCardExcerpt(post);
  const body = stripSourcesSection(post.body);
  const html = marked.parse(body) as string;
  const lang = post.body_language === "zh-HK" ? "zh-Hant-HK" : "en";

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
          <BlogShare title={title} slug={post.slug} />
        </div>
      </header>

      <div className="prose blog-prose" lang={lang} dangerouslySetInnerHTML={{ __html: html }} />

      <div className="post-end" lang="en">
        <div className="chips">
          <span className="muted" style={{ font: "500 13px Roboto,sans-serif", marginRight: 4 }}>
            Filed under
          </span>
          {post.category && (
            <Link className="chip chip-sm" href={categoryHref(post.category)}>
              {categoryLabel(post.category)}
            </Link>
          )}
        </div>
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
