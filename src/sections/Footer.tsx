import { type MouseEvent, type ComponentType } from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { ArrowUpRight, Circle, Coffee, Github, Heart, Instagram, Linkedin } from 'lucide-react';
import { footerConfig } from '@/config';

const SOCIAL_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  Github,
  Instagram,
  Linkedin,
};

function getIcon(iconName: string): ComponentType<{ className?: string }> {
  return SOCIAL_ICONS[iconName] || Circle;
}

export function Footer() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  if (!footerConfig.logo && footerConfig.columns.length === 0 && footerConfig.socialLinks.length === 0) return null;

  const handleNavClick = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        element.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
      }
    }
  };

  return (
    <footer ref={ref} className="w-full bg-exvia-black text-white py-16 lg:py-24">
      <div className="container-large px-6 lg:px-12">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8">
          {/* Brand Column */}
          <div
            className={cn(
              'lg:col-span-4 space-y-6 transition-all duration-800 ease-out-quart',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            )}
          >
            {footerConfig.logo && (
              <a href="#" className="inline-block">
                <span className="text-2xl font-semibold tracking-tight">{footerConfig.logo}</span>
              </a>
            )}
            {footerConfig.description && (
              <p className="text-sm text-white/70 max-w-xs leading-relaxed">
                {footerConfig.description}
              </p>
            )}

            {/* Social Links */}
            {footerConfig.socialLinks.length > 0 && (
              <div className="flex gap-3 pt-2">
                {footerConfig.socialLinks.map((social) => {
                  const Icon = getIcon(social.iconName);
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center hover:bg-white hover:text-exvia-black transition-all duration-300"
                      aria-label={social.label}
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Links Columns */}
          {footerConfig.columns.map((column, colIndex) => (
            <div
              key={column.title}
              className={cn(
                'lg:col-span-2 transition-all duration-800 ease-out-quart',
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              )}
              style={{ transitionDelay: `${(colIndex + 1) * 100}ms` }}
            >
              <h4 className="text-xs font-geist-mono uppercase tracking-widest text-white/65 mb-4">
                {column.title}
              </h4>
              <ul className="space-y-3">
                {column.links.map((link) => {
                  const isExternal = /^https?:\/\//.test(link.href);
                  const linkClass =
                    'min-h-11 text-sm text-white/75 hover:text-white transition-colors inline-flex items-center gap-1 group';
                  const arrow = (
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  );
                  return (
                    <li key={link.label}>
                      {isExternal ? (
                        <a href={link.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                          {link.label}
                          {arrow}
                        </a>
                      ) : link.href.startsWith('/') ? (
                        <Link to={link.href} className={linkClass}>
                          {link.label}
                          {arrow}
                        </Link>
                      ) : (
                        <a href={link.href} onClick={(e) => handleNavClick(e, link.href)} className={linkClass}>
                          {link.label}
                          {arrow}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Newsletter Column */}
          {footerConfig.newsletterHeading && (
            <div
              className={cn(
                'lg:col-span-2 transition-all duration-800 ease-out-quart',
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              )}
              style={{ transitionDelay: '400ms' }}
            >
              <h4 className="text-xs font-geist-mono uppercase tracking-widest text-white/40 mb-4">
                {footerConfig.newsletterHeading}
              </h4>
              {footerConfig.newsletterDescription && (
                <p className="text-sm text-white/60 mb-4">
                  {footerConfig.newsletterDescription}
                </p>
              )}
              <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder={footerConfig.newsletterPlaceholder || "your@email.com"}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/30 transition-colors"
                />
                {footerConfig.newsletterButtonText && (
                  <button
                    type="submit"
                    className="w-full px-4 py-3 bg-white text-exvia-black text-sm font-medium rounded-lg hover:bg-white/90 transition-colors"
                  >
                    {footerConfig.newsletterButtonText}
                  </button>
                )}
              </form>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        {(footerConfig.copyright || footerConfig.credit) && (
          <div
            className={cn(
              'mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 transition-all duration-800 ease-out-quart',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            )}
            style={{ transitionDelay: '500ms' }}
          >
            {footerConfig.copyright && (
                <p className="text-xs text-white/65">
                {footerConfig.copyright}
              </p>
            )}
            {footerConfig.credit && (
              <p className="text-xs text-white/65 inline-flex items-center gap-1.5">
                <span>{footerConfig.credit}</span>
                <Heart className="credit-heart w-3.5 h-3.5 text-white/70" aria-hidden="true" />
                <Coffee className="credit-coffee w-3.5 h-3.5 text-white/70" aria-hidden="true" />
              </p>
            )}
          </div>
        )}
      </div>
    </footer>
  );
}
