"use client";

import { PostsList, type StudioListPost } from "@/components/studio/posts-list";
import { useNewPost } from "@/components/studio/use-new-post";

export function PostsListPage({
  posts,
  demoMode = false,
}: {
  posts: StudioListPost[];
  demoMode?: boolean;
}) {
  const { newPost } = useNewPost(demoMode);

  return <PostsList posts={posts} demoMode={demoMode} onNewPost={() => void newPost()} />;
}
