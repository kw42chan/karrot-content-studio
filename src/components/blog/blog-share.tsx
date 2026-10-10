import { getSiteUrl } from "@/lib/env";

export function BlogShare({ title, slug }: { title: string; slug: string }) {
  const base = getSiteUrl().replace(/\/$/, "");
  const url = `${base}/p/${slug}`;
  const enc = encodeURIComponent(url);
  const encTitle = encodeURIComponent(title);
  const links = [
    { label: "𝕏", href: `https://twitter.com/intent/tweet?url=${enc}&text=${encTitle}` },
    { label: "f", href: `https://www.facebook.com/sharer/sharer.php?u=${enc}` },
    { label: "in", href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc}` },
    { label: "✉", href: `mailto:?subject=${encTitle}&body=${enc}` },
  ];

  return (
    <div className="share">
      <span>SHARE</span>
      {links.map((l) => (
        <a key={l.label} href={l.href} className="share-icon" aria-label={`Share on ${l.label}`}>
          <i>{l.label}</i>
        </a>
      ))}
    </div>
  );
}
