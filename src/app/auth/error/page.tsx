import { friendlyCallbackError } from "@/lib/auth/messages";
import Link from "next/link";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; description?: string }>;
}) {
  const params = await searchParams;
  const message = friendlyCallbackError(params.reason ?? null, params.description ?? null);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="font-display text-3xl">Sign-in problem</h1>
      <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm leading-relaxed text-red-900">
        {message}
      </p>
      <Link
        href="/login"
        className="mt-6 inline-flex justify-center rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white"
      >
        Back to sign in
      </Link>
    </main>
  );
}
