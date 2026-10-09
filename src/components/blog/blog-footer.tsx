import Link from "next/link";

const CONTACT_EMAIL = "darwin.chankawing@gmail.com";

export function BlogFooter() {
  return (
    <footer className="footer" id="book">
      <div className="footer-brand">
        <span className="footer-mark" aria-hidden="true">K</span>
        <div className="footer-brand-text">
          <strong>Karrot Digital</strong>
          <span>Darwin Chan</span>
        </div>
      </div>
      <div className="book-block">
        <h2 className="h-anton book-title">Book a conversation</h2>
        <p className="book-copy">
          Tell me about the AI or automation work you want to ship. Email works for now — a
          calendar link will replace this when ready.
        </p>
        <a className="btn btn-accent footer-cta" href={`mailto:${CONTACT_EMAIL}?subject=Book%20a%20conversation%20%E2%80%94%20Karrot%20Digital`}>
          Email Darwin
        </a>
        <p className="book-email">
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </div>
      <div className="footer-links">
        <Link href="/p">Posts</Link>
        <Link href="/p#services">Services</Link>
        <a className="footer-cta" href="#book">Book a conversation</a>
      </div>
      <div className="footer-meta">© 2026 Karrot Digital · Karrot Content Studio</div>
    </footer>
  );
}
