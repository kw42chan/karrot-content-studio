import { marked } from "marked";
import { getBookingUrl } from "@/lib/env";
import type { SourceCredit } from "@/lib/posts/build-sources-markdown";

marked.setOptions({ gfm: true, breaks: true });

export function renderKitPostHtml(params: {
  title: string;
  myTake: string;
  bodyMarkdown: string;
  sources: SourceCredit[];
  readMinutes?: number;
}): string {
  const bodyHtml = marked.parse(params.bodyMarkdown) as string;
  const myTakeHtml = params.myTake
    ? `<section class="my-take"><p class="my-take-label">My take</p><p>${escapeHtml(params.myTake)}</p></section>`
    : "";

  const sourcesHtml = params.sources
    .map(
      (s) => `
      <article class="source-card">
        <h4>${escapeHtml(s.author ?? s.title ?? "Source")}</h4>
        <p class="source-meta">${platformLabel(s.platform)}</p>
        <p>${escapeHtml(s.title ?? "")}</p>
        <a href="${escapeAttr(s.url)}">${escapeHtml(s.url)}</a>
      </article>`,
    )
    .join("");

  const booking = getBookingUrl();

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<style>
  body{font-family:Roboto,sans-serif;background:#FBF3EB;color:#000;margin:0;padding:24px;line-height:1.65;font-size:18px}
  .hero{background:#a89081;color:#FBF3EB;border-radius:32px 32px 24px 24px;padding:48px 64px 72px;margin-bottom:32px}
  .hero h1{font-family:Anton,sans-serif;font-size:48px;line-height:1.05;text-transform:none;margin:0 0 12px}
  .meta{font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;opacity:.9}
  .my-take{background:#F4E8DD;border-radius:24px;padding:24px 28px;margin:0 0 32px;border-left:4px solid #d18e63}
  .my-take-label{color:#d18e63;font-weight:700;font-size:12px;letter-spacing:.08em;text-transform:uppercase;margin:0 0 8px}
  .content{max-width:640px}
  .content h2{font-family:Anton,sans-serif;font-size:24px;margin:32px 0 12px}
  .sources{background:#F4E8DD;border-radius:24px;padding:24px;margin:40px 0}
  .sources h3{font-family:Anton,sans-serif;margin:0 0 16px}
  .source-card{background:#fff;border-radius:16px;padding:16px;margin-bottom:12px}
  .source-meta{font-size:14px;color:#373f45}
  .cta{background:#000;color:#FBF3EB;border-radius:24px;padding:32px 28px;margin:40px 0}
  .cta h3{font-family:Anton,sans-serif;font-size:28px;margin:0 0 12px}
  .cta a{display:inline-block;background:#d18e63;color:#FBF3EB;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600;margin-top:12px}
</style>
</head>
<body>
<div class="hero">
  <p class="meta">Karrot Digital · ${params.readMinutes ?? 4} min read</p>
  <h1>${escapeHtml(params.title)}</h1>
</div>
<div class="content">
  ${myTakeHtml}
  ${bodyHtml}
  <section class="sources"><h3>Sources</h3>${sourcesHtml}</section>
  <section class="cta">
    <h3>Talk to me about AI consultancy</h3>
    <p>I help businesses automate with intelligent tech — without the lockouts, dead ends, and half-finished AI experiments.</p>
    <a href="${escapeAttr(booking)}">Book a conversation</a>
  </section>
</div>
</body>
</html>`;
}

function platformLabel(p: string): string {
  if (p === "x") return "X / long-form article";
  if (p === "threads") return "Threads";
  return "Web article";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
