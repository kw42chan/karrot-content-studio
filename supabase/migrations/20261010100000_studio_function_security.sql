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

-- studio_is_admin: anon must not EXECUTE (no public RPC probe). authenticated needs EXECUTE
-- so RLS policies USING (studio_is_admin()) work for signed-in queries.
revoke all on function public.studio_is_admin() from public;
revoke all on function public.studio_is_admin() from anon;
grant execute on function public.studio_is_admin() to authenticated;
grant execute on function public.studio_is_admin() to service_role;

-- studio_admin_email: only used inside SECURITY DEFINER studio_is_admin(); not for client RPC.
revoke all on function public.studio_admin_email() from public;
revoke all on function public.studio_admin_email() from anon;
revoke all on function public.studio_admin_email() from authenticated;
grant execute on function public.studio_admin_email() to service_role;
