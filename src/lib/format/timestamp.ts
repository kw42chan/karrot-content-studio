/** Stable en-US formatting in Asia/Hong_Kong — same on server and client (avoids hydration #418). */

const STUDIO_DATE_TIME = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Hong_Kong",
});

export function formatStudioDateTimeHkt(iso: string | null | undefined): string {
  if (!iso) return "";
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "";
  return STUDIO_DATE_TIME.format(ms);
}

/** @deprecated Use formatStudioDateTimeHkt */
export const formatStudioDateTimeUtc = formatStudioDateTimeHkt;
