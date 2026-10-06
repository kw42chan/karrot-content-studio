-- Google OAuth: email may appear on JWT root, user_metadata, or app_metadata
create or replace function public.studio_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce(
    auth.jwt() ->> 'email',
    auth.jwt() -> 'user_metadata' ->> 'email',
    auth.jwt() -> 'app_metadata' ->> 'email',
    ''
  )) = lower(public.studio_admin_email());
$$;
