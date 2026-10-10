import { AUTHOR_NAME, BLOG_TAGLINE } from "@/lib/blog/constants";

export function BlogNewsletter() {
  return (
    <section className="section bottom-banner" id="about">
      <div className="watermark" aria-hidden="true" />
      <div className="bn h-anton">Get new posts by email</div>
      <div className="bb">{AUTHOR_NAME} · {BLOG_TAGLINE}</div>
      <form className="email-bar" action="#" method="post">
        <input type="email" placeholder="Email address" aria-label="Email address" />
        <button type="submit">Subscribe</button>
      </form>
      <div className="fine">Powered by Kit · unsubscribe anytime</div>
    </section>
  );
}
