-- Admin policies call studio_is_admin(), which anon can no longer EXECUTE
-- (see 20261010100000_studio_function_security). Policies scoped to PUBLIC are
-- evaluated for anon too, so anon reads of published posts failed with
-- "permission denied for function studio_is_admin". Scope admin policies to
-- authenticated; public read policies for published content stay as-is.

alter policy studio_posts_admin_all on public.studio_posts to authenticated;
alter policy studio_sources_admin_all on public.studio_sources to authenticated;
alter policy studio_post_sources_admin_all on public.studio_post_sources to authenticated;
alter policy studio_suggestions_admin on public.studio_suggestions to authenticated;
alter policy studio_post_versions_admin on public.studio_post_versions to authenticated;
alter policy studio_post_comments_admin on public.studio_post_comments to authenticated;
alter policy studio_post_variants_admin on public.studio_post_variants to authenticated;
alter policy studio_post_variant_versions_admin on public.studio_post_variant_versions to authenticated;
