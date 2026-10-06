-- Admin check: JWT email claim only (never user_metadata — user-editable via updateUser).
create or replace function public.studio_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = lower(public.studio_admin_email());
$$;
