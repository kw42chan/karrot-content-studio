import { serverAuthRedirectBaseUrl } from "@/lib/auth/site-url";
import { isAdminSession } from "@/lib/auth/session-email";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAdminEmail } from "@/lib/env";

function errorRedirect(origin: string, reason: string, description?: string) {
  const url = new URL("/auth/error", origin);
  url.searchParams.set("reason", reason);
  if (description) url.searchParams.set("description", description);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = serverAuthRedirectBaseUrl(request.url);
  const next = searchParams.get("next") ?? "/studio";

  const oauthError = searchParams.get("error");
  const oauthDescription = searchParams.get("error_description");
  if (oauthError) {
    return errorRedirect(origin, oauthError, oauthDescription ?? undefined);
  }

  const code = searchParams.get("code");
  if (!code) {
    return errorRedirect(origin, "missing_code", "No login code was provided.");
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return errorRedirect(origin, error.code ?? "exchange_failed", error.message);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminSession(user, getAdminEmail())) {
    await supabase.auth.signOut();
    return errorRedirect(origin, "not_allowed", "This account isn't allowed");
  }

  const safeNext = next.startsWith("/") ? next : "/studio";
  return NextResponse.redirect(`${origin}${safeNext}`);
}
