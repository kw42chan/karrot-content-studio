"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const NAV_RESET_MS = 15_000;

export async function postNewStudioPost(): Promise<string> {
  const res = await fetch("/api/studio/new-post", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
  if (!res.ok || !data.id) {
    throw new Error(data.error ?? `HTTP ${res.status}`);
  }
  return data.id;
}

export function useNewPost(demoMode = false) {
  const router = useRouter();
  const pathname = usePathname();
  const busy = useRef(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const release = useCallback(() => {
    if (resetTimer.current) {
      clearTimeout(resetTimer.current);
      resetTimer.current = null;
    }
    busy.current = false;
    setPending(false);
  }, []);

  useEffect(() => {
    release();
    setError(null);
  }, [pathname, release]);

  useEffect(() => () => release(), [release]);

  const newPost = useCallback(async () => {
    if (demoMode) {
      router.push("/demo/studio");
      return;
    }
    if (busy.current) {
      console.warn("[useNewPost] Ignored click — create request already in progress.");
      return;
    }
    busy.current = true;
    setPending(true);
    setError(null);
    resetTimer.current = setTimeout(() => {
      console.warn("[useNewPost] Navigation did not occur within 15s; re-enabling New post.");
      release();
      setError("Creating a post took too long. Please try again.");
    }, NAV_RESET_MS);

    try {
      const id = await postNewStudioPost();
      router.push(`/studio/posts/${id}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : "network error";
      console.error("[useNewPost] Create failed:", e);
      release();
      setError(`Couldn't create a new post: ${message}`);
    }
  }, [demoMode, router, release]);

  return { newPost, pending, error, clearError };
}
