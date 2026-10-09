"use client";

import { ChangePasswordForm } from "@/components/studio/change-password-form";
import { StudioNavContext } from "@/components/studio/shell/studio-nav-context";
import { useNewPost } from "@/components/studio/use-new-post";
import { createClient } from "@/lib/supabase/client";
import { getAdminEmail } from "@/lib/env";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const LIVE_SITE = "/p";
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
  const { newPost: createNewPost, pending: newPostPending } = useNewPost(demoMode);

  useEffect(() => {
    if (demoMode) {
      setEmail(getAdminEmail());
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, [demoMode]);

  const postsHref = demoMode ? "/demo/studio/posts" : "/studio";
  const isPosts =
    pathname === "/studio" ||
    pathname === "/demo/studio/posts" ||
    pathname.startsWith("/demo/studio/posts/");
  const isEditor =
    pathname.includes("/studio/posts/") ||
    pathname === "/demo/studio" ||
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

  function newPost() {
    setDrawerOpen(false);
    void createNewPost();
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
      <button
        type="button"
        className="nav-item nav-item-primary"
        onClick={newPost}
        disabled={newPostPending}
      >
        {newPostPending ? "Creating…" : "+ New post"}
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
        <button
          type="button"
          className="studio-bottom-new"
          onClick={newPost}
          disabled={newPostPending}
          aria-label="New post"
        >
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
      {!demoMode && email && <ChangePasswordForm email={email} />}
      {!demoMode && (
        <button type="button" className="studio-signout" onClick={onSignOut}>
          Sign out
        </button>
      )}
    </div>
  );
}
