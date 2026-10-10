import { getKitApiKey } from "@/lib/env";

const KIT_BASE = "https://api.kit.com/v4";

export type KitPublishMode = "web_only" | "web_and_email";

export type KitPublishResult =
  | { ok: true; broadcastId: string }
  | { ok: false; error: string };

export async function publishToKit(params: {
  subject: string;
  contentHtml: string;
  broadcastId?: string | null;
  mode: KitPublishMode;
  confirmEmail?: boolean;
}): Promise<KitPublishResult> {
  const apiKey = getKitApiKey().trim();
  if (!apiKey) {
    return {
      ok: false,
      error:
        "Kit is not configured (KIT_API_KEY missing). Add the key in Vercel, or publish without email.",
    };
  }

  if (!params.subject.trim()) {
    return { ok: false, error: "Publish failed: post title is required." };
  }

  if (!params.contentHtml.trim()) {
    return { ok: false, error: "Publish failed: post body is empty." };
  }

  if (params.mode === "web_and_email" && !params.confirmEmail) {
    return {
      ok: false,
      error: "Email send requires confirmation — check the box before publishing.",
    };
  }

  const body: Record<string, unknown> = {
    subject: params.subject,
    content: params.contentHtml,
    public: true,
    send_at: params.mode === "web_and_email" ? new Date().toISOString() : null,
  };

  if (params.broadcastId) {
    const res = await fetch(`${KIT_BASE}/broadcasts/${params.broadcastId}`, {
      method: "PUT",
      headers: {
        "X-Kit-Api-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const t = await res.text();
      return {
        ok: false,
        error: `Kit update failed (${res.status}): ${shortKitBody(t)}`,
      };
    }
    const json = (await res.json()) as { broadcast?: { id?: string } };
    return { ok: true, broadcastId: json.broadcast?.id ?? params.broadcastId };
  }

  const res = await fetch(`${KIT_BASE}/broadcasts`, {
    method: "POST",
    headers: {
      "X-Kit-Api-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    return {
      ok: false,
      error: `Kit create failed (${res.status}): ${shortKitBody(t)}`,
    };
  }
  const json = (await res.json()) as { broadcast?: { id?: string } };
  const id = json.broadcast?.id;
  if (!id) {
    return { ok: false, error: "Kit did not return a broadcast id." };
  }
  return { ok: true, broadcastId: id };
}

function shortKitBody(text: string, max = 240): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (!oneLine) return "(empty response)";
  return oneLine.length > max ? `${oneLine.slice(0, max)}…` : oneLine;
}
