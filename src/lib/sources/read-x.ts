import { parseXStatus } from "./normalize-url";
import type { SourceReadResult } from "./types";

type FxArticleBlock = { type?: string; text?: string };
type FxTweet = {
  text?: string;
  author?: { name?: string };
  created_at?: string;
  article?: {
    title?: string;
    content?: { blocks?: FxArticleBlock[] };
  };
};

export async function readXSource(url: string): Promise<SourceReadResult> {
  const parsed = parseXStatus(url);
  if (!parsed) {
    throw new Error("Could not parse X post URL");
  }
  const apiUrl = `https://api.fxtwitter.com/${parsed.user}/status/${parsed.id}`;
  const res = await fetch(apiUrl, {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new Error(`fxtwitter returned ${res.status}`);
  }
  const data = (await res.json()) as { tweet?: FxTweet };
  const tweet = data.tweet;
  if (!tweet) {
    throw new Error("No tweet in fxtwitter response");
  }

  let title: string | null = null;
  let text = tweet.text ?? "";

  if (tweet.article?.content?.blocks?.length) {
    title = tweet.article.title ?? null;
    text = tweet.article.content.blocks
      .map((b) => b.text ?? "")
      .filter(Boolean)
      .join("\n\n");
  }

  return {
    title,
    author: tweet.author?.name ?? parsed.user,
    text,
    published_at: tweet.created_at ?? null,
    url,
    full_text: true,
  };
}
