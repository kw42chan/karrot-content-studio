"use client";

import { coverWordForPost, isUsableCoverUrl } from "@/lib/blog/public-posts";
import type { PublicBlogPost } from "@/lib/blog/types";
import { useEffect, useState } from "react";

/** Taupe + title-word fallback; optional photo when cover_url loads successfully. */
export function BlogPostCover({ post }: { post: PublicBlogPost }) {
  const coverText = coverWordForPost(post);
  const coverLang = post.body_language === "zh-HK" ? "zh-Hant-HK" : "en";
  const url = isUsableCoverUrl(post.cover_url) ? post.cover_url!.trim() : null;

  const [photoReady, setPhotoReady] = useState(false);

  useEffect(() => {
    if (!url) {
      setPhotoReady(false);
      return;
    }
    let cancelled = false;
    setPhotoReady(false);
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setPhotoReady(true);
    };
    img.onerror = () => {
      if (!cancelled) setPhotoReady(false);
    };
    img.src = url;
    return () => {
      cancelled = true;
    };
  }, [url]);

  const showPhoto = Boolean(url && photoReady);

  return (
    <div
      className={`cover${showPhoto ? " is-photo" : ""}`}
      style={
        showPhoto
          ? {
              backgroundImage: `url(${url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      {!showPhoto && (
        <span className="cover-word h-anton" lang={coverLang} style={{ whiteSpace: "pre-line" }}>
          {coverText}
        </span>
      )}
    </div>
  );
}
