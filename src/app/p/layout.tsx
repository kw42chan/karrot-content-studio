import { BlogFooter } from "@/components/blog/blog-footer";
import { BlogNav } from "@/components/blog/blog-nav";
import { Noto_Sans_TC } from "next/font/google";
import type { Metadata } from "next";
import "@/styles/blog.css";

const noto = Noto_Sans_TC({
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
  variable: "--font-noto-tc",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Karrot Digital — Blog",
    template: "%s | Karrot Digital",
  },
  description:
    "Practical notes from Darwin Chan on AI tools, workflow automation and keeping your AI accounts running smoothly.",
};

export default function PublicBlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`blog-root ${noto.variable}`}>
      <BlogNav />
      <div className="page">
        <div className="container">{children}</div>
        <BlogFooter />
      </div>
    </div>
  );
}
