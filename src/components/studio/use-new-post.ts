"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export function useNewPost(demoMode = false) {
  const router = useRouter();
  const pathname = usePathname();
  const busy = useRef(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    busy.current = false;
    setPending(false);
  }, [pathname]);

  const newPost = useCallback(async () => {
    if (demoMode) {
      router.push("/demo/studio");
      return;
    }
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    try {
      const res = await fetch("/api/studio/new-post", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
      if (!res.ok || !data.id) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      router.push(`/studio/posts/${data.id}`);
    } catch (e) {
      busy.current = false;
      setPending(false);
      window.alert(
        `Couldn't create a new post: ${e instanceof Error ? e.message : "network error"}`,
      );
    }
  }, [demoMode, router]);

  return { newPost, pending };
}
