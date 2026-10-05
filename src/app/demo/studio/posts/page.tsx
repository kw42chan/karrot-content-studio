import { PostsListPage } from "@/components/studio/posts-list-page";
import type { StudioListPost } from "@/components/studio/posts-list";
import { DEMO_POST } from "@/lib/demo/content";

const DEMO_LIST: StudioListPost[] = [
  {
    id: "demo-1",
    title: DEMO_POST.title,
    slug: DEMO_POST.slug,
    status: "draft",
    updated_at: new Date("2026-10-05T16:12:00Z").toISOString(),
    channels: ["blog", "x", "threads", "instagram"],
    subtitle: "3 sources · Claude ban HK creators",
  },
  {
    id: "demo-2",
    title: "Why Kit + a custom CMS beat all-in-one blogging",
    slug: "kit-custom-cms",
    status: "published",
    updated_at: new Date("2026-10-01T10:00:00Z").toISOString(),
    channels: ["blog"],
    subtitle: "Web + email publish",
  },
];

export default function DemoStudioPostsPage() {
  return (
    <div className="studio-list-page">
      <PostsListPage posts={DEMO_LIST} demoMode />
    </div>
  );
}
