import { detectPlatform, normalizeSourceUrl } from "./normalize-url";
import { readThreadsSource } from "./read-threads";
import { readWebSource } from "./read-web";
import { readXSource } from "./read-x";
import type { SourceReadResult } from "./types";

export async function readSourceFromUrl(rawUrl: string): Promise<{
  normalizedUrl: string;
  platform: "x" | "threads" | "web";
  result: SourceReadResult;
}> {
  const normalizedUrl = normalizeSourceUrl(rawUrl);
  const platform = detectPlatform(normalizedUrl);

  let result: SourceReadResult;
  switch (platform) {
    case "x":
      result = await readXSource(normalizedUrl);
      break;
    case "threads":
      result = await readThreadsSource(normalizedUrl);
      break;
    default:
      result = await readWebSource(normalizedUrl);
  }

  return { normalizedUrl, platform, result };
}
