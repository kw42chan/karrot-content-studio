"use client";

import { getBookingUrl } from "@/lib/env";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function BlogNav({ active = "posts" }: { active?: "posts" | "post" }) {
  const bookingUrl = getBookingUrl();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const postsActive = active === "posts" || pathname === "/p";

  return (
    <nav className="site-nav" aria-label="Site">
      <div className="site-nav-inner">
        <Link className="nav-brand" href="/p" aria-label="Karrot Digital home">
          <span className="nav-mark" aria-hidden="true">K</span>
          <span className="nav-wordmark">Karrot Digital</span>
        </Link>
        <div className="nav-actions">
          <Link className={`nav-link ${postsActive ? "is-active" : ""}`} href="/p">
            Posts
          </Link>
          <Link className="nav-link" href="/p#services">
            Services
          </Link>
          <Link className="nav-link" href="/p#about">
            About
          </Link>
          <a className="nav-cta" href={bookingUrl}>
            Book a conversation
          </a>
          <button
            type="button"
            className="nav-menu-btn"
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="navDrawer"
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>
      <div className={`nav-drawer ${open ? "open" : ""}`} id="navDrawer" hidden={!open}>
        <Link href="/p" onClick={() => setOpen(false)}>Posts</Link>
        <Link href="/p#services" onClick={() => setOpen(false)}>Services</Link>
        <Link href="/p#about" onClick={() => setOpen(false)}>About</Link>
        <a href={bookingUrl} onClick={() => setOpen(false)}>Book a conversation</a>
      </div>
    </nav>
  );
}
