import { useState, useEffect, useRef, type MouseEvent } from 'react';
import { cn } from '@/lib/utils';
import { AnimatedButton } from './AnimatedButton';
import { useMagnetic } from '@/hooks/useMotion';
import { navigationConfig } from '@/config';

export function Navigation() {
  const magneticRef = useMagnetic<HTMLDivElement>(8);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMenuLinkRef = useRef<HTMLAnchorElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!navigationConfig.logo && navigationConfig.links.length === 0) return null;

  const handleNavClick = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      element.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
      const shouldReturnFocus = isMenuOpen;
      setIsMenuOpen(false);
      if (shouldReturnFocus) {
        requestAnimationFrame(() => menuButtonRef.current?.focus({ preventScroll: true }));
      }
    }
  };

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-[background-color,color,box-shadow] duration-500 ease-out-circ',
          isScrolled || isMenuOpen ? 'bg-white/95 backdrop-blur-md shadow-xs' : 'bg-transparent'
        )}
      >
        <div className="w-full px-6 lg:px-12 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            {navigationConfig.logo && (
              <a href="#hero" className="flex min-h-11 items-center gap-2" aria-label="Snaxx Tech home">
                <img
                  src="/images/wordmark/letter-5.webp"
                  alt=""
                  draggable={false}
                  className="h-6 w-auto select-none"
                />
                <span className={cn(
                  "text-2xl font-semibold tracking-tight transition-colors duration-200",
                  isScrolled || isMenuOpen ? "text-exvia-black" : "text-white"
                )}>
                  {navigationConfig.logo}
                </span>
              </a>
            )}

            {/* Desktop Navigation */}
            {navigationConfig.links.length > 0 && (
              <div className="hidden lg:flex items-center gap-10">
                {navigationConfig.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className={cn(
                      "text-base transition-colors duration-200 relative group",
                      isScrolled ? "text-exvia-black/80 hover:text-exvia-black" : "text-white/90 hover:text-white"
                    )}
                  >
                    {link.label}
                    <span className={cn(
                      "absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100",
                      isScrolled ? "bg-exvia-black" : "bg-white"
                    )} />
                  </a>
                ))}
              </div>
            )}

            {/* Contact Button */}
            {navigationConfig.contactLabel && (
              <div className="hidden lg:block">
                <div ref={magneticRef} className="inline-block will-change-transform">
                  <AnimatedButton
                    href={navigationConfig.contactHref || "#contact"}
                    variant={isScrolled ? "primary" : "outline-white"}
                    size="md"
                    className="pressable"
                  >
                    {navigationConfig.contactLabel}
                  </AnimatedButton>
                </div>
              </div>
            )}

            {/* Mobile Menu Button */}
            {navigationConfig.links.length > 0 && (
              <button
                ref={menuButtonRef}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="relative flex h-11 w-11 flex-col items-center justify-center gap-[6px] lg:hidden"
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-navigation"
              >
                <span
                  className={cn(
                    'h-0.5 w-7 transition-[opacity,transform] duration-300 ease-out-quad origin-center',
                    isScrolled || isMenuOpen ? 'bg-exvia-black' : 'bg-white',
                    isMenuOpen && 'translate-y-2 rotate-[-45deg]'
                  )}
                />
                <span
                  className={cn(
                    'h-0.5 w-7 transition-[opacity,transform] duration-300 ease-out-quad',
                    isScrolled || isMenuOpen ? 'bg-exvia-black' : 'bg-white',
                    isMenuOpen && 'scale-90 opacity-0'
                  )}
                />
                <span
                  className={cn(
                    'h-0.5 w-7 transition-[opacity,transform] duration-300 ease-out-quad origin-center',
                    isScrolled || isMenuOpen ? 'bg-exvia-black' : 'bg-white',
                    isMenuOpen && '-translate-y-2 rotate-[45deg]'
                  )}
                />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {navigationConfig.links.length > 0 && (
        <div
          id="mobile-navigation"
          className={cn(
            'fixed inset-0 z-40 bg-white transition-[opacity,visibility] duration-500 ease-out-cubic lg:hidden',
            isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
          )}
        >
          <div className="flex flex-col items-center justify-center h-full gap-8">
            {navigationConfig.links.map((link, index) => (
              <a
                ref={index === 0 ? firstMenuLinkRef : undefined}
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={cn(
                  'text-3xl font-semibold text-exvia-black transition-[opacity,transform] duration-400 ease-out-quart',
                  isMenuOpen
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-8'
                )}
                style={{ transitionDelay: isMenuOpen ? `${index * 60}ms` : '0ms' }}
              >
                {link.label}
              </a>
            ))}
            {navigationConfig.contactLabel && (
              <AnimatedButton
                href={navigationConfig.contactHref || "#contact"}
                variant="primary"
                size="lg"
                className={cn(
                  'mt-4 pressable transition-[opacity,transform] duration-400 ease-out-quart',
                  isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                )}
                style={{ transitionDelay: isMenuOpen ? '240ms' : '0ms' }}
                onClick={() => {
                  setIsMenuOpen(false);
                  requestAnimationFrame(() => menuButtonRef.current?.focus({ preventScroll: true }));
                }}
              >
                {navigationConfig.contactLabel}
              </AnimatedButton>
            )}
          </div>
        </div>
      )}
    </>
  );
}
