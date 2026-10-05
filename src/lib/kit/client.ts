import { getKitApiKey } from "@/lib/env";

const KIT_BASE = "https://api.kit.com/v4";

export type KitPublishMode = "web_only" | "web_and_email";

export async function publishToKit(params: {
  subject: string;
  contentHtml: string;
  broadcastId?: string | null;
  mode: KitPublishMode;
  confirmEmail?: boolean;
}): Promise<{ broadcastId: string }> {
  const apiKey = getKitApiKey();
  if (!apiKey) {
    throw new Error("KIT_API_KEY is not configured");
  }
  if (params.mode === "web_and_email" && !params.confirmEmail) {
    throw new Error("Email send requires confirmation");
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
      throw new Error(`Kit update failed: ${res.status} ${t}`);
    }
    const json = (await res.json()) as { broadcast?: { id?: string } };
    return { broadcastId: json.broadcast?.id ?? params.broadcastId };
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
    throw new Error(`Kit create failed: ${res.status} ${t}`);
  }
  const json = (await res.json()) as { broadcast?: { id?: string } };
  const id = json.broadcast?.id;
  if (!id) throw new Error("Kit did not return broadcast id");
  return { broadcastId: id };
}
