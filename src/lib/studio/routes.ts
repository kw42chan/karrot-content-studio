/** CMS posts list (production studio home). */
export const STUDIO_POSTS_HOME = "/studio";

type StudioRouter = {
  replace: (href: string) => void;
  refresh: () => void;
};

/** After delete from the posts list (already on /studio in production). */
export function navigateToStudioPostsHome(router: StudioRouter): void {
  router.replace(STUDIO_POSTS_HOME);
  router.refresh();
}

/**
 * After delete from the post editor — hard leave `/studio/posts/[id]` so the
 * deleted post page cannot re-render or 404 in place.
 */
export function navigateToStudioPostsHomeAfterEditorDelete(): void {
  window.location.replace(STUDIO_POSTS_HOME);
}
