"use client";

import { friendlySignInError, isRateLimitError } from "@/lib/auth/messages";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const RATE_LIMIT_COOLDOWN_MS = 60_000;

function authCallbackBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/studio";
  const error = params.get("error");
  const authError = params.get("auth_error");
  const authMessage = params.get("auth_message");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [cooldownEndsAt, setCooldownEndsAt] = useState<number | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (!cooldownEndsAt) {
      setCooldownSeconds(0);
      return;
    }
    const tick = () => {
      const left = Math.max(0, Math.ceil((cooldownEndsAt - Date.now()) / 1000));
      setCooldownSeconds(left);
      if (left <= 0) setCooldownEndsAt(null);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [cooldownEndsAt]);

  const submitDisabled = loading || cooldownSeconds > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setLoading(true);

    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      setFormError("Enter your email address.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const base = authCallbackBaseUrl();
      if (!base) {
        setFormError("Could not determine site URL for sign-in. Set NEXT_PUBLIC_SITE_URL.");
        return;
      }
      const redirectTo = `${base}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: normalized,
        options: { emailRedirectTo: redirectTo },
      });

      if (signInError) {
        setFormError(friendlySignInError(signInError));
        if (isRateLimitError(signInError)) {
          setCooldownEndsAt(Date.now() + RATE_LIMIT_COOLDOWN_MS);
        }
        return;
      }

      setSent(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not send the login email.");
    } finally {
      setLoading(false);
    }
  }

  function buttonLabel() {
    if (loading) return "Sending…";
    if (cooldownSeconds > 0) return `Try again in ${cooldownSeconds}s`;
    return "Email me a link";
  }

  return (
    <>
      {error === "not_admin" && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          This email is not allowed to use Content Studio.
        </p>
      )}
      {authError && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {authMessage
            ? decodeURIComponent(authMessage)
            : "Sign-in failed. Please request a new login link."}
        </p>
      )}
      {formError && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {formError}
        </p>
      )}
      {sent ? (
        <p className="mt-6 rounded-xl border border-[var(--karrot-border)] bg-white px-4 py-4 text-sm">
          Check your email for the login link.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--karrot-border)] bg-white px-3 py-2.5"
              placeholder="darwin.chankawing@gmail.com"
              autoComplete="email"
              disabled={loading}
            />
          </label>
          <button
            type="submit"
            disabled={submitDisabled}
            className="btn-primary btn-primary--block"
            aria-busy={loading}
          >
            {buttonLabel()}
          </button>
        </form>
      )}
    </>
  );
}

export function LoginShell() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <Link href="/" className="mb-8 text-sm text-[var(--karrot-muted)]">← Back</Link>
      <h1 className="font-display text-3xl">Sign in</h1>
      <p className="mt-2 text-[var(--karrot-muted)]">
        Magic link for the Karrot Digital admin account only.
      </p>
      <LoginForm />
    </main>
  );
}
