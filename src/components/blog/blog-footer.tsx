import { getBookingUrl } from "@/lib/env";
import Link from "next/link";

export function BlogFooter() {
  const bookingUrl = getBookingUrl();
  return (
    <footer className="footer" id="book">
      <div className="footer-brand">
        <span className="footer-mark" aria-hidden="true">K</span>
        <div className="footer-brand-text">
          <strong>Karrot Digital</strong>
          <span>Darwin Chan</span>
        </div>
      </div>
      <div className="footer-links">
        <Link href="/p">Posts</Link>
        <Link href="/p#services">Services</Link>
        <a className="footer-cta" href={bookingUrl}>Book a conversation</a>
      </div>
      <div className="footer-meta">© 2026 Karrot Digital · Karrot Content Studio</div>
    </footer>
  );
}
