import type { User } from "@supabase/supabase-js";

export function sessionEmail(user: User | null | undefined): string {
  if (!user) return "";
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const fromMeta =
    typeof meta?.email === "string" ? meta.email : typeof meta?.email_address === "string" ? meta.email_address : "";
  return (user.email ?? fromMeta).trim().toLowerCase();
}
