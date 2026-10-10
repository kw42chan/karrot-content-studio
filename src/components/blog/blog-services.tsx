import { ServiceIcon } from "@/components/blog/service-icon";
import { BLOG_SERVICES } from "@/lib/blog/services";
import { getBookingUrl } from "@/lib/env";
import Link from "next/link";

type Variant = "band" | "strip" | "rail";

export function BlogServices({ variant = "band" }: { variant?: Variant }) {
  if (BLOG_SERVICES.length === 0) return null;

  const bookingUrl = getBookingUrl();

  if (variant === "rail") {
    return (
      <ul className="help-list">
        {BLOG_SERVICES.map((s) => (
          <li key={s.id}>
            {s.title}
            <Link href={s.href.startsWith("/") ? s.href : `/p${s.href}`}>→</Link>
          </li>
        ))}
      </ul>
    );
  }

  if (variant === "strip") {
    return (
      <section className="section strip" aria-labelledby="workTitle">
        <div className="strip-head">
          <div className="left">
            <h2 className="h-anton" id="workTitle">Work with Karrot Digital</h2>
          </div>
          <a className="btn btn-accent" href={bookingUrl}>Book a conversation</a>
        </div>
        <div className="service-grid compact">
          {BLOG_SERVICES.map((s) => (
            <article key={s.id} className="service-card">
              <div className="service-icon"><ServiceIcon icon={s.icon} /></div>
              <div>
                <h3 className="h-anton">{s.title}</h3>
                <p>{s.description}</p>
                <a className="learn-more" href={s.href}>Learn more →</a>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="section services-band" id="services" aria-labelledby="servicesTitle">
      <div className="services-head">
        <div>
          <h2 className="h-anton" id="servicesTitle">How I can help</h2>
          <p>
            I help businesses automate with intelligent tech — without the lockouts, dead ends, and
            half-finished AI experiments.
          </p>
        </div>
        <a className="btn btn-accent" href={bookingUrl}>Book a conversation</a>
      </div>
      <div className="service-grid">
        {BLOG_SERVICES.map((s) => (
          <article key={s.id} className="service-card">
            <div className="service-icon"><ServiceIcon icon={s.icon} /></div>
            <h3 className="h-anton">{s.title}</h3>
            <p>{s.description}</p>
            <a className="learn-more" href={s.href}>Learn more →</a>
          </article>
        ))}
      </div>
    </section>
  );
}
