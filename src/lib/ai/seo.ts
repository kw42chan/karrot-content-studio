import { completeText, parseSections } from "@/lib/ai/llm-json";
import { seoSlug } from "@/lib/posts/seo-slug";

export type SeoDraft = {
  seoTitle: string;
  metaDescription: string;
  slug: string;
};

const TITLE_MAX = 60;
const META_MAX = 160;

export function clampSeo(raw: { seoTitle: string; metaDescription: string; slug: string }): SeoDraft {
  const seoTitle = raw.seoTitle.replace(/\s+/g, " ").trim().slice(0, TITLE_MAX);
  const metaDescription = raw.metaDescription.replace(/\s+/g, " ").trim().slice(0, META_MAX);
  const slug = seoSlug(raw.slug) || seoSlug(raw.seoTitle);
  return { seoTitle, metaDescription, slug };
}

export function parseSeoDraft(text: string): SeoDraft {
  const sections = parseSections(text);
  return clampSeo({
    seoTitle: sections.SEO_TITLE ?? "",
    metaDescription: sections.META_DESCRIPTION ?? "",
    slug: sections.SLUG ?? "",
  });
}

export async function generateSeoFields(params: {
  body: string;
  language: "zh-HK" | "en";
}): Promise<SeoDraft> {
  const zh = params.language === "zh-HK";
  const prompt = `You write SEO fields for a Karrot Digital blog post.
Language for the title and description: ${zh ? "Traditional Chinese (香港書面語)" : "English"}.
The slug is ALWAYS lowercase English words separated by hyphens (romanize the topic if the post is Chinese). No dates, no "draft".

Return EXACTLY this plain-text format and nothing else:
===SEO_TITLE===
(${zh ? "about 25–35 Chinese characters" : "about 50–60 characters"}, no quotes)
===META_DESCRIPTION===
(${zh ? "about 70–90 Chinese characters" : "about 150–160 characters"}, one sentence, no quotes)
===SLUG===
(lowercase-hyphenated-english, at most 60 characters)
===END===

Post body:
${params.body.trim().slice(0, 6000)}`;

  const { content } = await completeText({ prompt, maxTokens: 400 });
  const parsed = parseSeoDraft(content);
  if (!parsed.seoTitle || !parsed.metaDescription || !parsed.slug) {
    const missing = [
      !parsed.seoTitle && "title",
      !parsed.metaDescription && "description",
      !parsed.slug && "slug",
    ].filter(Boolean);
    throw new Error(
      `The AI response was missing ${missing.join(", ")}. Please try Fill SEO again.`,
    );
  }
  return parsed;
}
