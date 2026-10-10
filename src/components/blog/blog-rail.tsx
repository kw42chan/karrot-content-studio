import { BlogServices } from "@/components/blog/blog-services";
import { POST_CATEGORIES, categoryHref, categoryLabel } from "@/lib/blog/categories";
import { countByCategory } from "@/lib/blog/queries";
import type { PublicBlogPost } from "@/lib/blog/types";
import { getBookingUrl } from "@/lib/env";
import Link from "next/link";

export function BlogRail({
  posts,
  activeCategory,
}: {
  posts: PublicBlogPost[];
  activeCategory: PublicBlogPost["category"];
}) {
  const counts = countByCategory(posts);
  const bookingUrl = getBookingUrl();
  const visibleCategories = POST_CATEGORIES.filter((cat) => counts[cat] > 0);

  return (
    <aside className="rail" lang="en" aria-label="Sidebar">
      <div className="rail-sticky">
        <div className="help-card">
          <div className="watermark" aria-hidden="true" />
          <h3 className="h-anton">Need help with this?</h3>
          <p>
            I help businesses automate with intelligent tech — without the lockouts, dead ends, and
            half-finished AI experiments.
          </p>
          <BlogServices variant="rail" />
          <a className="btn btn-accent" href={bookingUrl}>Book a conversation</a>
        </div>
        <div className="rail-box">
          <h4>Categories</h4>
          <ul className="cat-list">
            {visibleCategories.map((cat) => (
              <li key={cat}>
                <Link
                  href={categoryHref(cat)}
                  className={activeCategory === cat ? "is-active" : ""}
                >
                  {categoryLabel(cat)}
                  <span className="n">{counts[cat]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
