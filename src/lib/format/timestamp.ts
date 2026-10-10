/** Stable en-US formatting in UTC — avoids SSR/client locale hydration mismatches. */

const STUDIO_DATE_TIME = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

export function formatStudioDateTimeUtc(iso: string | null | undefined): string {
  if (!iso) return "";
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "";
  return STUDIO_DATE_TIME.format(ms);
}
