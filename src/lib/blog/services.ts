export type BlogService = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: "chat" | "workflow" | "training";
};

/** TODO(Darwin): Add service cards when titles, descriptions, and links are finalized. */
export const BLOG_SERVICES: BlogService[] = [];
