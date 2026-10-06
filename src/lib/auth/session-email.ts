import type { User } from "@supabase/supabase-js";

/** Verified identity email only — never user_metadata (client-editable). */
export function sessionEmail(user: User | null | undefined): string {
  if (!user?.email || !hasTrustedEmailVerification(user)) {
    return "";
  }
  return user.email.trim().toLowerCase();
}

export function isAdminSession(user: User | null | undefined, adminEmail: string): boolean {
  const allowed = adminEmail.trim().toLowerCase();
  if (!allowed) return false;
  return sessionEmail(user) === allowed;
}

function hasTrustedEmailVerification(user: User): boolean {
  if (user.email_confirmed_at) return true;

  if (user.identities?.some((identity) => identity.provider === "google")) {
    return true;
  }

  const appMeta = user.app_metadata as Record<string, unknown> | undefined;
  if (appMeta?.provider === "google") return true;
  const providers = appMeta?.providers;
  if (Array.isArray(providers) && providers.includes("google")) return true;

  return false;
}
