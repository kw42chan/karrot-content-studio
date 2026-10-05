"use client";

import { StudioNavContext } from "@/components/studio/shell/studio-nav-context";
import { createClient } from "@/lib/supabase/client";
import { getAdminEmail } from "@/lib/env";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const LIVE_SITE = "https://karrotdigital.com";
const AVATAR =
  "https://embed.filekitcdn.com/e/qZ375j2sBMyZfkkw6tSqH2/oJsbTGL9j6tMWN6r6KwcBW";

export function StudioAppShell({
  children,
  demoMode = false,
}: {
  children: React.ReactNode;
  demoMode?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (demoMode) {
      setEmail(getAdminEmail());
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, [demoMode]);

  const postsHref = demoMode ? "/demo/studio" : "/studio";
  const isPosts =
    pathname === "/studio" ||
    pathname === "/demo/studio" ||
    pathname === "/demo/studio/posts" ||
    pathname.startsWith("/demo/studio/posts/");
  const isEditor =
    pathname.includes("/studio/posts/") ||
    Boolean(pathname.match(/\/demo\/studio\/(x|zh|instagram)/));

  const navCtx = useMemo(
    () => ({ openDrawer: () => setDrawerOpen(true) }),
    [],
  );

  async function signOut() {
    if (demoMode) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function newPost() {
    if (demoMode) {
      router.push("/demo/studio");
      return;
    }
    const res = await fetch("/api/studio/new-post", { method: "POST" });
    if (!res.ok) return;
    const { id } = (await res.json()) as { id: string };
    router.push(`/studio/posts/${id}`);
  }

  const nav = (
    <>
      <Link
        href={postsHref}
        className={`nav-item ${isPosts && !isEditor ? "nav-item-active" : ""}`}
        onClick={() => setDrawerOpen(false)}
      >
        Posts
      </Link>
      <button type="button" className="nav-item nav-item-primary" onClick={newPost}>
        + New post
      </button>
      <div className="nav-divider" />
      <a
        href={LIVE_SITE}
        target="_blank"
        rel="noopener noreferrer"
        className="nav-item nav-item-ext"
        onClick={() => setDrawerOpen(false)}
      >
        Live site <span className="nav-ext-icon">↗</span>
      </a>
    </>
  );

  return (
    <StudioNavContext.Provider value={navCtx}>
    <div className="studio-app">
      <aside className="studio-sidebar studio-sidebar-desktop" aria-label="App navigation">
        <Brand />
        <nav className="nav-stack">{nav}</nav>
        <AccountFoot email={email} onSignOut={signOut} demoMode={demoMode} />
      </aside>

      {drawerOpen && (
        <div className="studio-drawer-backdrop md:hidden" onClick={() => setDrawerOpen(false)} />
      )}
      <aside className={`studio-drawer ${drawerOpen ? "open" : ""}`} aria-label="Menu">
        <Brand />
        <nav className="nav-stack">{nav}</nav>
        <AccountFoot email={email} onSignOut={signOut} demoMode={demoMode} />
      </aside>

      <div className="studio-main">{children}</div>

      <nav className="studio-bottom-bar" aria-label="Primary">
        <Link href={postsHref} className={isPosts ? "active" : ""}>Posts</Link>
        <button type="button" className="studio-bottom-new" onClick={newPost} aria-label="New post">
          +
        </button>
        <a href={LIVE_SITE} target="_blank" rel="noopener noreferrer">Live site</a>
      </nav>
    </div>
    </StudioNavContext.Provider>
  );
}

function Brand() {
  return (
    <div className="studio-brand">
      <div className="studio-brand-mark">K</div>
      <div>
        <strong>Content Studio</strong>
        <span>Karrot Digital</span>
      </div>
    </div>
  );
}

function AccountFoot({
  email,
  onSignOut,
  demoMode,
}: {
  email: string | null;
  onSignOut: () => void;
  demoMode: boolean;
}) {
  return (
    <div className="studio-sidebar-foot">
      <img src={AVATAR} alt="" className="studio-avatar" width={32} height={32} />
      <div className="studio-acct">
        <b>Darwin Chan</b>
        <span>{email ?? "…"}</span>
      </div>
      {!demoMode && (
        <button type="button" className="studio-signout" onClick={onSignOut}>
          Sign out
        </button>
      )}
    </div>
  );
}
