"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/studio";
  const error = params.get("error");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    setSent(true);
    setLoading(false);
  }

  return (
    <>
      {error === "not_admin" && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          This email is not allowed to use Content Studio.
        </p>
      )}
      {sent ? (
        <p className="mt-6 rounded-xl border border-[var(--karrot-border)] bg-white px-4 py-4 text-sm">
          Check your inbox for the sign-in link.
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
              className="mt-1 w-full rounded-xl border border-[var(--karrot-border)] px-3 py-2.5"
              placeholder="darwin.chankawing@gmail.com"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[var(--karrot-primary)] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Sending…" : "Email me a link"}
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
