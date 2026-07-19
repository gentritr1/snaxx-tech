import { useEffect, useRef, type MouseEvent } from 'react';
import { ArrowRight, ArrowUpRight, FileText, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';
import { useScrollAnimation, useStaggerAnimation } from '@/hooks/useScrollAnimation';
import { portfolioConfig, type ProjectItem } from '@/config';

interface ProjectCardProps {
  project: ProjectItem;
  index: number;
  isVisible: boolean;
  wide?: boolean;
}

function ProjectCard({ project, index, isVisible, wide = false }: ProjectCardProps) {
  const mediaRef = useRef<HTMLDivElement>(null);
  const tiltEnabled = useRef(false);
  const accent = project.accent || '#131313';
  const isExternal = Boolean(project.href);

  useEffect(() => {
    tiltEnabled.current =
      window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const handleMove = (event: MouseEvent<HTMLDivElement>) => {
    const element = mediaRef.current;
    if (!tiltEnabled.current || !element) return;

    const rect = element.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    element.style.transform = `perspective(1000px) rotateX(${-y * 4}deg) rotateY(${x * 4}deg)`;
  };

  const resetTilt = () => {
    if (mediaRef.current) mediaRef.current.style.transform = '';
  };

  const content = (
    <>
      <div
        ref={mediaRef}
        onMouseMove={handleMove}
        onMouseLeave={resetTilt}
        className="project-media relative overflow-hidden rounded-xl bg-exvia-subtle transition-transform duration-300 ease-out-quart"
        style={{ '--project-accent': accent } as React.CSSProperties}
      >
        <div className={cn(wide ? 'aspect-[16/9]' : 'aspect-[4/3]')}>
          <img
            src={project.image}
            alt={`${project.title} product artwork`}
            loading="lazy"
            className={cn(
              'h-full w-full object-cover transition-transform duration-500 ease-out-quart group-hover:scale-[1.025]',
              project.hasEmbeddedPromoFooter && 'object-center',
            )}
          />
        </div>

        <div className="project-accent-wash absolute inset-0 pointer-events-none" />

        <div className="absolute left-3 top-3 flex min-h-9 items-center gap-2 rounded-full bg-white px-3 text-xs font-medium text-exvia-black sm:left-4 sm:top-4">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} aria-hidden="true" />
          {project.status}
        </div>

        <span className="absolute right-3 top-3 flex min-h-9 items-center rounded-full bg-exvia-black/75 px-3 font-geist-mono text-[0.6875rem] text-white sm:right-4 sm:top-4">
          {project.year}
        </span>

        {project.hasEmbeddedPromoFooter && (
          <div className="absolute inset-x-0 bottom-0 flex min-h-14 items-center justify-between bg-[#faf9f7] px-4 text-xs font-medium text-exvia-black sm:px-6">
            <span>Play FJALË online</span>
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <h3 className="text-2xl font-semibold tracking-[-0.03em] text-exvia-black sm:text-3xl">
            {project.title}
          </h3>
          <p className="mt-1 max-w-md text-sm leading-relaxed text-exvia-black/65">{project.category}</p>
        </div>
        {isExternal && project.action && (
          <span className="mt-1 inline-flex min-h-10 shrink-0 items-center gap-1.5 text-sm font-medium text-exvia-black/70 group-hover:text-exvia-black">
            <span className="hidden sm:inline">{project.action}</span>
            {isExternal && <ArrowUpRight className="h-4 w-4" aria-hidden="true" />}
          </span>
        )}
      </div>

      {!isExternal && (project.privacyHref || project.termsHref) && (
        <div className="mt-4 flex flex-wrap gap-2" aria-label={`${project.title} legal documents`}>
          {project.privacyHref && (
            <Link
              to={project.privacyHref}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-exvia-black/15 bg-white px-3.5 text-sm font-medium text-exvia-black transition-colors duration-200 hover:border-exvia-black/35"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Privacy
            </Link>
          )}
          {project.termsHref && (
            <Link
              to={project.termsHref}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-exvia-black/15 bg-white px-3.5 text-sm font-medium text-exvia-black transition-colors duration-200 hover:border-exvia-black/35"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              Terms
            </Link>
          )}
        </div>
      )}
    </>
  );

  const className = cn(
    'group block rounded-xl transition-all duration-700 ease-out-quart',
    isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
    isExternal && 'cursor-pointer focus-visible:outline-none',
  );

  if (isExternal) {
    return (
      <a
        href={project.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${project.title}: ${project.action} (opens in a new tab)`}
        className={className}
        style={{ transitionDelay: `${index * 90}ms` }}
      >
        {content}
      </a>
    );
  }

  return (
    <article className={className} style={{ transitionDelay: `${index * 90}ms` }}>
      {content}
    </article>
  );
}

export function Portfolio() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({ threshold: 0.25 });
  const { containerRef: gridRef, visibleItems } = useStaggerAnimation(portfolioConfig.projects.length + 1, 110);
  const ctaIndex = portfolioConfig.projects.length;

  if (!portfolioConfig.heading && portfolioConfig.projects.length === 0) return null;

  return (
    <section id="portfolio" className="w-full bg-exvia-subtle/40 py-24 lg:py-32">
      <div className="container-large px-6 lg:px-12">
        <div ref={headerRef} className="mb-14 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)] lg:items-end lg:gap-16">
          <h2
            className={cn(
              'type-h2 max-w-4xl font-semibold text-exvia-black transition-all duration-700 ease-out-quart',
              headerVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0',
            )}
          >
            {portfolioConfig.heading}
          </h2>
          <p
            className={cn(
              'max-w-xl text-base leading-relaxed text-exvia-black/70 transition-all duration-700 ease-out-quart lg:justify-self-end',
              headerVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0',
            )}
            style={{ transitionDelay: '100ms' }}
          >
            {portfolioConfig.description}
          </p>
        </div>

        <div ref={gridRef} className="grid grid-cols-1 gap-x-6 gap-y-12 lg:grid-cols-3 lg:gap-y-16">
          {portfolioConfig.projects[0] && (
            <div className="lg:col-span-2">
              <ProjectCard project={portfolioConfig.projects[0]} index={0} isVisible={visibleItems[0]} wide />
            </div>
          )}

          {portfolioConfig.projects[1] && (
            <ProjectCard project={portfolioConfig.projects[1]} index={1} isVisible={visibleItems[1]} />
          )}

          {portfolioConfig.projects[2] && (
            <div className="lg:col-span-2">
              <ProjectCard project={portfolioConfig.projects[2]} index={2} isVisible={visibleItems[2]} wide />
            </div>
          )}

          {portfolioConfig.cta.heading && (
            <a
              href={portfolioConfig.cta.linkHref || '#contact'}
              className={cn(
                'group relative flex min-h-[20rem] flex-col justify-between overflow-hidden rounded-xl bg-exvia-black p-8 text-white transition-all duration-700 ease-out-quart lg:min-h-0',
                visibleItems[ctaIndex] ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
              )}
              style={{ transitionDelay: `${ctaIndex * 90}ms` }}
            >
              <span className="text-sm text-white/65">{portfolioConfig.cta.label}</span>
              <h3 className="max-w-sm text-3xl font-semibold leading-tight tracking-[-0.035em]">
                {portfolioConfig.cta.heading}
              </h3>
              <span className="inline-flex min-h-11 items-center gap-2 text-sm font-medium">
                {portfolioConfig.cta.linkText}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out-quart group-hover:translate-x-1" aria-hidden="true" />
              </span>
              <span className="portfolio-cta-arrow absolute -right-3 top-1/2 -translate-y-1/2 text-[8rem] font-medium leading-none text-white/[0.06]" aria-hidden="true">
                →
              </span>
            </a>
          )}

          {portfolioConfig.projects[3] && (
            <div className="lg:col-span-3">
              <ProjectCard project={portfolioConfig.projects[3]} index={3} isVisible={visibleItems[3]} wide />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
