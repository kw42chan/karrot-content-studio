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
  return process.env.OPENROUTER_MODEL ?? "qwen/qwen3-vl-32b-instruct";
}

export function getKitApiKey(): string {
  return required("KIT_API_KEY", true);
}

export function getBookingUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BOOKING_URL ??
    process.env.BOOKING_URL ??
    "https://karrotdigital.com/contact"
  );
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
