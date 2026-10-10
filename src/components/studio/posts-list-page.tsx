"use client";

import { deletePost } from "@/app/actions/studio";
import { PostsList, type StudioListPost } from "@/components/studio/posts-list";
import { useNewPost } from "@/components/studio/use-new-post";
import { navigateToStudioPostsHome } from "@/lib/studio/routes";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function PostsListPage({
  posts,
  demoMode = false,
}: {
  posts: StudioListPost[];
  demoMode?: boolean;
}) {
  const router = useRouter();
  const { newPost, pending: newPostPending, error: newPostError, clearError: clearNewPostError } =
    useNewPost(demoMode);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function onDeletePost(post: StudioListPost) {
    const label = post.title.trim() || post.slug || "this post";
    if (
      !window.confirm(
        `Delete "${label}" permanently?\n\nThis removes the post from the studio and public /p pages. This cannot be undone.`,
      )
    ) {
      return;
    }
    setDeletingId(post.id);
    try {
      const result = await deletePost(post.id);
      if (!result.ok) {
        window.alert(result.error);
        return;
      }
      navigateToStudioPostsHome(router);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      {newPostError && (
        <div className="studio-inline-alert studio-inline-alert-list" role="alert">
          <span>{newPostError}</span>
          <button type="button" className="studio-inline-alert-dismiss" onClick={clearNewPostError}>
            Dismiss
          </button>
        </div>
      )}
      <PostsList
        posts={posts}
        demoMode={demoMode}
        onNewPost={() => void newPost()}
        newPostPending={newPostPending}
        onDeletePost={demoMode ? undefined : onDeletePost}
        deletingId={deletingId}
      />
    </>
  );
}
