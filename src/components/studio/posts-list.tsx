"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type StudioListPost = {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  updated_at: string;
  channels: ("blog" | "x" | "threads" | "instagram")[];
  subtitle?: string;
};

export function PostsList({
  posts,
  demoMode = false,
  onNewPost,
}: {
  posts: StudioListPost[];
  demoMode?: boolean;
  onNewPost: () => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "draft" | "published">("all");

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      if (filter !== "all" && p.status !== filter) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
    });
  }, [posts, query, filter]);


  return (
    <>
      <header className="studio-list-topbar">
        <h1>Posts</h1>
        <div className="studio-list-top-actions">
          <button type="button" className="studio-btn studio-btn-ghost hidden sm:inline-flex">
            Import
          </button>
          <button type="button" className="studio-btn studio-btn-primary" onClick={onNewPost}>
            + New post
          </button>
        </div>
      </header>

      <div className="studio-list-toolbar">
        <input
          type="search"
          placeholder="Search posts…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="studio-list-search"
        />
        <div className="studio-list-filters">
          {(["all", "draft", "published"] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={filter === f ? "active" : ""}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : f === "draft" ? "Draft" : "Published"}
            </button>
          ))}
        </div>
      </div>

      <div className="studio-list-table-wrap">
        <table className="studio-list-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Channels</th>
              <th>Updated</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link
                    href={demoMode ? "/demo/studio" : `/studio/posts/${p.id}`}
                    className="studio-list-title-link"
                  >
                    <strong>{p.title}</strong>
                    {p.subtitle && <span>{p.subtitle}</span>}
                  </Link>
                </td>
                <td>
                  <div className="studio-channel-badges">
                    {p.channels.includes("blog") && <span className="badge-blog">Blog</span>}
                    {p.channels.includes("x") && <span className="badge-x">X</span>}
                    {p.channels.includes("threads") && <span className="badge-threads">Threads</span>}
                    {p.channels.includes("instagram") && <span className="badge-ig">IG</span>}
                  </div>
                </td>
                <td className="studio-list-date">
                  {new Date(p.updated_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </td>
                <td>
                  <span
                    className={`studio-list-status ${p.status === "published" ? "published" : "draft"}`}
                  >
                    {p.status === "published" ? "Published" : "Draft"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <div className="studio-list-empty">
            <p>No posts match your filters.</p>
            {onNewPost && (
              <button type="button" className="studio-btn studio-btn-primary" onClick={onNewPost}>
                + New post
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
