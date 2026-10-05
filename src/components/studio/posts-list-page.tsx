"use client";

import { PostsList, type StudioListPost } from "@/components/studio/posts-list";
import { useRouter } from "next/navigation";

export function PostsListPage({
  posts,
  demoMode = false,
}: {
  posts: StudioListPost[];
  demoMode?: boolean;
}) {
  const router = useRouter();

  async function onNewPost() {
    if (demoMode) {
      router.push("/demo/studio");
      return;
    }
    const res = await fetch("/api/studio/new-post", { method: "POST" });
    if (!res.ok) return;
    const { id } = (await res.json()) as { id: string };
    router.push(`/studio/posts/${id}`);
  }

  return <PostsList posts={posts} demoMode={demoMode} onNewPost={onNewPost} />;
}
