"use client";

import { friendlySignInError } from "@/lib/auth/messages";
import { isAdminSession } from "@/lib/auth/session-email";
import { clientAuthRedirectBaseUrl } from "@/lib/auth/site-url";
import { getAdminEmail } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

const SHOW_GOOGLE_OAUTH = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN === "true";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/studio";
  const error = params.get("error");
  const authError = params.get("auth_error");
  const authMessage = params.get("auth_message");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setFormError(friendlySignInError(signInError));
        return;
      }

      if (!isAdminSession(data.user, getAdminEmail())) {
        await supabase.auth.signOut();
        setFormError("This account isn't allowed to use Content Studio.");
        return;
      }

      router.push(next);
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setFormError(null);
    setGoogleLoading(true);

    try {
      const base = clientAuthRedirectBaseUrl();
      if (!base) {
        setFormError("Could not determine site URL for sign-in. Set NEXT_PUBLIC_SITE_URL.");
        return;
      }

      const redirectTo = `${base}/auth/callback?next=${encodeURIComponent(next)}`;
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (signInError) {
        setFormError(signInError.message || "Could not start Google sign-in.");
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not start Google sign-in.");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <>
      {error === "not_admin" && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          This account isn&apos;t allowed to use Content Studio.
        </p>
      )}
      {authError && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {authMessage
            ? decodeURIComponent(authMessage)
            : "Sign-in failed. Please try again."}
        </p>
      )}
      {formError && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {formError}
        </p>
      )}

      <form className="login-form mt-8" onSubmit={signInWithPassword}>
        <label className="login-field">
          <span>Email</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="login-field">
          <span>Password</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary btn-primary--block mt-2"
          aria-busy={loading}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {SHOW_GOOGLE_OAUTH && (
        <div className="login-oauth mt-6">
          <p className="login-oauth-divider">
            <span>Or</span>
          </p>
          <button
            type="button"
            disabled={googleLoading || loading}
            onClick={signInWithGoogle}
            className="btn-google"
            aria-busy={googleLoading}
          >
            <GoogleIcon />
            {googleLoading ? "Redirecting…" : "Sign in with Google"}
          </button>
        </div>
      )}
    </>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function LoginShell() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <Link href="/" className="mb-8 text-sm text-[var(--karrot-muted)]">← Back</Link>
      <h1 className="font-display text-3xl">Sign in</h1>
      <p className="mt-2 text-[var(--karrot-muted)]">
        Email and password for the Karrot Digital admin account.
      </p>
      <LoginForm />
    </main>
  );
}
