import type { KeyPoint } from "@/lib/blog/types";

export function keyPointsFromText(text: string | null | undefined): KeyPoint[] | null {
  const title = text?.trim();
  if (!title) return null;
  return [{ title }];
}

export function keyPointFields(text: string | null | undefined): {
  key_point: string | null;
  key_points: KeyPoint[] | null;
} {
  const title = text?.trim();
  if (!title) return { key_point: null, key_points: null };
  return { key_point: title, key_points: [{ title }] };
}
