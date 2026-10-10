-- Studio-only security hardening (does not touch news-feed / ingest tables).
-- Addresses Supabase advisors: mutable search_path on helpers; public EXECUTE on admin probes.

create or replace function public.studio_admin_email()
returns text
language sql
immutable
set search_path = public
as $$
  select 'darwin.chankawing@gmail.com'::text;
$$;

create or replace function public.studio_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- JWT email only (see 20261006100000_studio_is_admin_google.sql).
create or replace function public.studio_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = lower(public.studio_admin_email());
$$;

-- RLS policies call these as the table owner; clients must not RPC-probe admin state.
revoke all on function public.studio_is_admin() from public;
revoke all on function public.studio_is_admin() from anon;
revoke all on function public.studio_is_admin() from authenticated;

revoke all on function public.studio_admin_email() from public;
revoke all on function public.studio_admin_email() from anon;
revoke all on function public.studio_admin_email() from authenticated;

grant execute on function public.studio_is_admin() to service_role;
grant execute on function public.studio_admin_email() to service_role;
