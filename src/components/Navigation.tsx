import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { cn } from '@/lib/utils';
import { AnimatedButton } from './AnimatedButton';
import { useMagnetic } from '@/hooks/useMotion';
import { navigationConfig } from '@/config';
import { scrollToHash } from '@/lib/scroll';

const CHAPTERS: { id: string; label: string }[] = [
  { id: 'hero', label: 'Start' },
  { id: 'core', label: 'The core' },
  { id: 'software', label: 'Software' },
  { id: 'games', label: 'Games' },
  { id: 'studio', label: 'Studio' },
  { id: 'contact', label: 'Contact' },
];

export function Navigation() {
  const magneticRef = useMagnetic<HTMLDivElement>(8);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMenuLinkRef = useRef<HTMLAnchorElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [active, setActive] = useState('hero');
  const [footerInView, setFooterInView] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
        requestAnimationFrame(() => menuButtonRef.current?.focus({ preventScroll: true }));
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    const focusFrame = requestAnimationFrame(() => firstMenuLinkRef.current?.focus({ preventScroll: true }));
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
      cancelAnimationFrame(focusFrame);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Which chapter owns the middle of the viewport.
  useEffect(() => {
    const sections = CHAPTERS.map((c) => document.getElementById(c.id)).filter((el): el is HTMLElement => Boolean(el));
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // The rail would sit on top of the footer columns.
  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer) return;
    const observer = new IntersectionObserver(([entry]) => setFooterInView(entry.isIntersecting), { threshold: 0 });
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  if (!navigationConfig.logo && navigationConfig.links.length === 0) return null;

  const handleNavClick = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith('#')) return;
    e.preventDefault();
    if (scrollToHash(href)) {
      const shouldReturnFocus = isMenuOpen;
      setIsMenuOpen(false);
      if (shouldReturnFocus) requestAnimationFrame(() => menuButtonRef.current?.focus({ preventScroll: true }));
    }
  };

  const activeIndex = Math.max(0, CHAPTERS.findIndex((c) => c.id === active));
  const linkIsActive = (href: string) => href === `#${active}`;

  return (
    <>
      <nav
        className={cn(
          'fixed left-0 right-0 top-0 z-50 transition-[background-color,border-color,box-shadow] duration-500 ease-out-circ',
          isScrolled || isMenuOpen ? 'glass-strong' : 'bg-transparent',
        )}
        aria-label="Primary"
      >
        <div className="w-full px-6 py-3 lg:px-12">
          <div className="flex items-center justify-between">
            {navigationConfig.logo && (
              <a
                href="#hero"
                onClick={(e) => handleNavClick(e, '#hero')}
                className="flex min-h-11 items-center gap-2.5 rounded-md"
                aria-label="Snaxx Tech home"
              >
                <img src="/images/wordmark/letter-5.webp" alt="" draggable={false} className="h-6 w-auto select-none" />
                <span className="font-display text-lg font-medium tracking-[-0.02em] text-ink">{navigationConfig.logo}</span>
              </a>
            )}

            {navigationConfig.links.length > 0 && (
              <div className="hidden items-center gap-9 lg:flex">
                {navigationConfig.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    aria-current={linkIsActive(link.href) ? 'true' : undefined}
                    className={cn(
                      'group relative min-h-11 py-3 text-sm transition-colors duration-200',
                      linkIsActive(link.href) ? 'text-ink' : 'text-mist hover:text-ink',
                    )}
                  >
                    {link.label}
                    <span
                      className={cn(
                        'absolute bottom-2 left-0 h-px w-full origin-left bg-ember transition-transform duration-300 ease-out-quart',
                        linkIsActive(link.href) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
                      )}
                    />
                  </a>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3">
              {navigationConfig.contactLabel && (
                <div className="hidden lg:block">
                  <div ref={magneticRef} className="inline-block will-change-transform">
                    <AnimatedButton href={navigationConfig.contactHref || '#contact'} variant="primary" size="md" onClick={(e) => handleNavClick(e as MouseEvent<HTMLAnchorElement>, navigationConfig.contactHref)}>
                      {navigationConfig.contactLabel}
                    </AnimatedButton>
                  </div>
                </div>
              )}
              {navigationConfig.links.length > 0 && (
                <button
                  ref={menuButtonRef}
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="relative flex h-11 w-11 flex-col items-center justify-center gap-[6px] rounded-md lg:hidden"
                  aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={isMenuOpen}
                  aria-controls="mobile-navigation"
                >
                  <span className={cn('h-px w-6 bg-ink transition-[opacity,transform] duration-300 ease-out-quad', isMenuOpen && 'translate-y-[7px] rotate-45')} />
                  <span className={cn('h-px w-6 bg-ink transition-[opacity,transform] duration-300 ease-out-quad', isMenuOpen && 'scale-x-0 opacity-0')} />
                  <span className={cn('h-px w-6 bg-ink transition-[opacity,transform] duration-300 ease-out-quad', isMenuOpen && '-translate-y-[7px] -rotate-45')} />
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Chapter rail */}
      <nav
        className={cn(
          'fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-3 transition-opacity duration-300 lg:flex',
          footerInView && 'pointer-events-none opacity-0',
        )}
        aria-label="Chapters"
        inert={footerInView || undefined}
      >
        {CHAPTERS.map((c, i) => (
          <a
            key={c.id}
            href={`#${c.id}`}
            onClick={(e) => handleNavClick(e, `#${c.id}`)}
            className="group flex min-h-6 items-center gap-3 rounded-md"
            aria-current={active === c.id ? 'true' : undefined}
          >
            <span
              className={cn(
                'label rounded bg-void/90 px-1.5 transition-[opacity,transform] duration-300 ease-out-quart',
                active === c.id
                  ? 'translate-x-0 text-ink opacity-100'
                  : 'translate-x-2 text-mist opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100',
              )}
            >
              {c.label}
            </span>
            <span
              className={cn(
                'block h-px w-7 origin-right transition-[transform,background-color] duration-300 ease-out-quart',
                active === c.id ? 'bg-ember' : i < activeIndex ? 'scale-x-[0.571] bg-ink/50' : 'scale-x-[0.571] bg-ink/25 group-hover:bg-ink/60',
              )}
            />
          </a>
        ))}
      </nav>

      {/* Mobile menu */}
      {navigationConfig.links.length > 0 && (
        <div
          id="mobile-navigation"
          className={cn(
            'fixed inset-0 z-40 bg-void transition-[opacity,visibility] ease-out-cubic lg:hidden',
            isMenuOpen ? 'visible opacity-100 duration-300' : 'pointer-events-none invisible opacity-0 duration-200',
          )}
        >
          <div className="flex h-full flex-col items-start justify-center gap-6 px-8">
            {navigationConfig.links.map((link, index) => (
              <a
                ref={index === 0 ? firstMenuLinkRef : undefined}
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={cn(
                  'font-display text-4xl font-medium tracking-[-0.03em] text-ink transition-[opacity,transform] duration-400 ease-out-quart',
                  isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
                )}
                style={{ transitionDelay: isMenuOpen ? `${index * 60}ms` : '0ms' }}
              >
                {link.label}
              </a>
            ))}
            {navigationConfig.contactLabel && (
              <div
                className={cn('mt-4 transition-[opacity,transform] duration-400 ease-out-quart', isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0')}
                style={{ transitionDelay: isMenuOpen ? '240ms' : '0ms' }}
              >
                <AnimatedButton
                  href={navigationConfig.contactHref || '#contact'}
                  variant="primary"
                  size="lg"
                  onClick={(e) => handleNavClick(e as MouseEvent<HTMLAnchorElement>, navigationConfig.contactHref || '#contact')}
                >
                  {navigationConfig.contactLabel}
                </AnimatedButton>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
