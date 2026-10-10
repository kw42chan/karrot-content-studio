import { completeText, parseSections } from "@/lib/ai/llm-json";
import { deriveSlugWhenModelOmits } from "@/lib/posts/seo-fill";
import { seoSlug } from "@/lib/posts/seo-slug";

export type SeoDraft = {
  seoTitle: string;
  metaDescription: string;
  slug: string;
};

const TITLE_MAX = 60;
const META_MAX = 160;

function seoTitleHasCjk(title: string): boolean {
  return /[\u4e00-\u9fff]/.test(title);
}

export function clampSeo(raw: { seoTitle: string; metaDescription: string; slug: string }): SeoDraft {
  const seoTitle = raw.seoTitle.replace(/\s+/g, " ").trim().slice(0, TITLE_MAX);
  const metaDescription = raw.metaDescription.replace(/\s+/g, " ").trim().slice(0, META_MAX);
  let slug = seoSlug(raw.slug);
  if (!slug && seoTitle && !seoTitleHasCjk(seoTitle)) {
    slug = seoSlug(seoTitle);
  }
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
  if (!parsed.seoTitle || !parsed.metaDescription) {
    const missing = [
      !parsed.seoTitle && "title",
      !parsed.metaDescription && "description",
    ].filter(Boolean);
    throw new Error(
      `The AI response was missing ${missing.join(", ")}. Please try Fill SEO again.`,
    );
  }

  let slug = deriveSlugWhenModelOmits(
    parsed.seoTitle,
    parsed.metaDescription,
    parsed.slug,
    parsed.slug,
  );
  if (!slug) {
    slug = await inferEnglishSlug({
      seoTitle: parsed.seoTitle,
      metaDescription: parsed.metaDescription,
      body: params.body,
    });
  }
  if (!slug) {
    throw new Error("The AI response was missing slug. Please try Fill SEO again.");
  }

  return {
    seoTitle: parsed.seoTitle,
    metaDescription: parsed.metaDescription,
    slug,
  };
}

/** Short follow-up when the main SEO response has title/description but no ASCII slug. */
export async function inferEnglishSlug(params: {
  seoTitle: string;
  metaDescription: string;
  body: string;
}): Promise<string> {
  const prompt = `Write ONE URL slug for a blog post: lowercase English words separated by hyphens, at most 60 characters.
Romanize or translate the topic if the title is Chinese. No quotes, no explanation, slug only.

SEO title: ${params.seoTitle.trim()}
Meta: ${params.metaDescription.trim().slice(0, 200)}
Body excerpt: ${params.body.trim().slice(0, 800)}`;

  const { content } = await completeText({ prompt, maxTokens: 80 });
  const slug = seoSlug(content.trim());
  return slug.length >= 2 ? slug : "";
}
