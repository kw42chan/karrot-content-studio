function required(name: string, optional = false): string {
  const v = process.env[name];
  if (!v && !optional) {
    if (process.env.NODE_ENV === "test" || process.env.npm_lifecycle_event === "build") {
      return "";
    }
  }
  return v ?? "";
}

export function getAdminEmail(): string {
  return process.env.ADMIN_EMAIL ?? "darwin.chankawing@gmail.com";
}

export function getOpenRouterKey(): string {
  return required("OPENROUTER_API_KEY", true);
}

export function getOpenRouterModel(): string {
  return process.env.OPENROUTER_MODEL ?? "qwen/qwen3-vl-235b-a22b-instruct";
}

export function getKitApiKey(): string {
  return required("KIT_API_KEY", true);
}

/** On-site booking anchor — karrotdigital.com currently redirect-loops. */
export const DEFAULT_BOOKING_PATH = "/p#book";

const BROKEN_BOOKING_HOSTS = ["karrotdigital.com"];

export function getBookingUrl(): string {
  const raw = (
    process.env.NEXT_PUBLIC_BOOKING_URL ??
    process.env.BOOKING_URL ??
    DEFAULT_BOOKING_PATH
  ).trim();
  if (!raw) return DEFAULT_BOOKING_PATH;
  try {
    if (raw.startsWith("/") || raw.startsWith("#") || raw.startsWith("mailto:")) {
      return raw;
    }
    const host = new URL(raw).hostname.replace(/^www\./, "");
    if (BROKEN_BOOKING_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) {
      return DEFAULT_BOOKING_PATH;
    }
  } catch {
    return DEFAULT_BOOKING_PATH;
  }
  return raw;
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
