/** User-facing copy for Supabase auth errors (login + callback). */

export function isRateLimitError(error: { message?: string; code?: string }): boolean {
  const code = error.code ?? "";
  const message = error.message ?? "";
  return code === "over_email_send_rate_limit" || message.includes("over_email_send_rate_limit");
}

export function friendlySignInError(error: {
  message?: string;
  code?: string;
  status?: number;
}): string {
  const code = error.code ?? "";
  const message = error.message ?? "";

  if (code === "over_email_send_rate_limit" || message.includes("over_email_send_rate_limit")) {
    return "Too many login emails, please wait a few minutes.";
  }

  if (
    code === "redirect_uri_mismatch" ||
    message.toLowerCase().includes("redirect") ||
    message.toLowerCase().includes("email redirect")
  ) {
    return "Sign-in redirect is not configured correctly. Check NEXT_PUBLIC_SITE_URL and Supabase Auth redirect URLs, then try again.";
  }

  if (code === "invalid_credentials" || message.toLowerCase().includes("invalid login")) {
    return "Email or password is incorrect.";
  }

  if (message) return message;
  return "Could not sign in. Please try again.";
}

export function friendlyCallbackError(reason: string | null, description: string | null): string {
  const r = (reason ?? "").toLowerCase();
  const d = (description ?? "").toLowerCase();

  if (
    r.includes("access_denied") ||
    d.includes("expired") ||
    d.includes("invalid") ||
    r.includes("otp_expired")
  ) {
    return "This login link is invalid or has expired. Request a new link from the sign-in page.";
  }

  if (d.includes("redirect") || r.includes("redirect")) {
    return "Sign-in could not finish because the redirect URL is not allowed. Check NEXT_PUBLIC_SITE_URL and Supabase Auth redirect URLs.";
  }

  if (r === "not_allowed" || d.includes("isn't allowed") || d.includes("is not allowed")) {
    return "This account isn't allowed";
  }

  if (description) return description;
  if (reason) return reason.replace(/_/g, " ");
  return "Sign-in could not be completed. Please try again.";
}
