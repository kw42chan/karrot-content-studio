import type { PostCategory } from "@/lib/blog/categories";

export type KeyPoint = {
  title: string;
  subtitle?: string;
};

export type PublicBlogPost = {
  id: string;
  title: string;
  slug: string;
  seo_title: string | null;
  meta_description: string | null;
  excerpt: string | null;
  my_take: string;
  body: string;
  body_language: "zh-HK" | "en";
  published_at: string | null;
  category: PostCategory | null;
  read_time: number | null;
  cover_url: string | null;
  key_points: KeyPoint[] | null;
};
