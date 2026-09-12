import { aboutConfig, ctaConfig, threadPageConfig } from "@/config";
import { ArrowRight } from "lucide-react";

export function Studio() {
  return (
    <section id="studio" className="thread-page-section thread-studio-section">
      <span id="about" className="thread-anchor" />
      <span id="services" className="thread-anchor" />
      <span id="contact" className="thread-anchor" />
      <div className="thread-section-heading">
        <p className="thread-section-label">02 / {aboutConfig.label}</p>
        <h2>{aboutConfig.heading}</h2>
        <p>{aboutConfig.description}</p>
        <div className="thread-actions">
          <a className="thread-primary" href={ctaConfig.buttonHref}>
            {threadPageConfig.contactLabel}{" "}
            <ArrowRight size={16} aria-hidden="true" />
          </a>
          <a className="thread-secondary" href="#apps">
            {threadPageConfig.supportLabel}
          </a>
        </div>
      </div>
      <dl className="thread-studio-facts">
        {aboutConfig.stats.map((stat) => (
          <div key={stat.label}>
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
