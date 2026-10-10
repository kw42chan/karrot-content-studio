/** Base URL for OAuth redirectTo (client-side). */
export function clientAuthRedirectBaseUrl(): string {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  }

  const origin = window.location.origin;
  if (window.location.hostname.endsWith(".vercel.app")) {
    return origin;
  }

  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  return fromEnv || origin;
}

/** Base URL for auth callback redirects (server-side). */
export function serverAuthRedirectBaseUrl(requestUrl: string): string {
  const requestOrigin = new URL(requestUrl).origin;
  const host = new URL(requestUrl).hostname;
  if (host.endsWith(".vercel.app")) {
    return requestOrigin;
  }

  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  return fromEnv || requestOrigin;
}
