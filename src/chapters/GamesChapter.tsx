import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, FileText, LifeBuoy, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { gamesConfig, type GameItem } from '@/config';
import { setHover, subscribeHover } from '@/experience/sceneState';
import { useSequenceReveal } from '@/hooks/useChapterReveal';
import { gsap } from '@/experience/scroll';
import { prefersReducedMotion } from '@/experience/quality';

function GameCard({ game, index, active }: { game: GameItem; index: number; active: boolean }) {
  const linkClass =
    'pressable inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/[0.12] px-3.5 text-sm font-medium text-silver transition-colors hover:border-white/30 hover:text-white';
  return (
    <article
      className="product-accent product-ring glass w-full max-w-md rounded-xl p-6 transition-[border-color,box-shadow] duration-300 ease-out-quart lg:p-7"
      style={{ '--accent': game.accent } as CSSProperties}
      data-active={active ? 'true' : 'false'}
      onMouseEnter={() => setHover(game.id)}
      onMouseLeave={() => setHover(null)}
      aria-labelledby={`game-${game.id}-title`}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="label-mono flex items-center gap-2.5 text-mist">
          <span className="product-dot" aria-hidden="true" />
          {game.status}
        </p>
        <span className="label-mono text-[0.625rem] text-mist" aria-hidden="true">
          {String(index + 1).padStart(2, '0')} / {String(gamesConfig.games.length).padStart(2, '0')}
        </span>
      </div>
      <h3 id={`game-${game.id}-title`} className="font-display type-title mt-5 text-white">
        {game.name}
      </h3>
      <p className="mt-1 text-sm text-silver/80">{game.category}</p>
      <p className="mt-4 text-sm leading-relaxed text-mist">{game.description}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {game.href && (
          <a href={game.href} target="_blank" rel="noopener noreferrer" className={cn(linkClass, 'bg-silver text-ink hover:bg-white hover:text-ink')}>
            {game.actionLabel ?? 'Open'}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        )}
        {game.privacyHref && (
          <Link to={game.privacyHref} className={linkClass}>
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Privacy
          </Link>
        )}
        {game.termsHref && (
          <Link to={game.termsHref} className={linkClass}>
            <FileText className="h-4 w-4" aria-hidden="true" />
            Terms
          </Link>
        )}
        {game.supportHref && (
          <Link to={game.supportHref} className={linkClass}>
            <LifeBuoy className="h-4 w-4" aria-hidden="true" />
            Support
          </Link>
        )}
      </div>
    </article>
  );
}

export function GamesChapter() {
  const section = useRef<HTMLElement>(null);
  const header = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const [hover, setLocal] = useState<string | null>(null);
  useEffect(() => subscribeHover(setLocal), []);
  useSequenceReveal(section, cards, gamesConfig.games.length);

  // Persistent chapter header: in at the start, out at the very end.
  useEffect(() => {
    const sectionEl = section.current;
    const el = header.current;
    if (!sectionEl || !el) return;
    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 1 });
      return;
    }
    const tl = gsap.timeline({ scrollTrigger: { trigger: sectionEl, start: 'top top', end: 'bottom bottom', scrub: true } });
    tl.fromTo(el, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.05, ease: 'power2.out' }, 0.01);
    tl.to(el, { opacity: 0, y: -20, duration: 0.05, ease: 'power2.in' }, 0.94);
    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  return (
    <section id="games" ref={section} className="relative" style={{ height: '420vh' }}>
      <div className="chapter-stage">
        <div className="container-large relative h-full w-full px-6 lg:px-12">
          <div ref={header} className="chapter-copy absolute left-6 top-20 max-w-sm sm:top-24 lg:left-12 lg:top-28">
            <p className="label-mono flex items-center gap-3 text-mist">
              <span className="text-ember">{gamesConfig.index}</span>
              <span className="h-px w-6 bg-white/20" aria-hidden="true" />
              <span>{gamesConfig.label}</span>
            </p>
            <h2 className="font-display type-title mt-3 text-white sm:mt-4">{gamesConfig.heading}</h2>
            <p className="mt-3 hidden text-sm leading-relaxed text-mist lg:block">{gamesConfig.description}</p>
          </div>

          <div className="absolute inset-x-6 bottom-8 flex justify-start lg:inset-x-12 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2">
            {gamesConfig.games.map((game, i) => (
              <div
                key={game.id}
                ref={(el) => {
                  cards.current[i] = el;
                }}
                className="chapter-copy absolute bottom-0 left-0 w-full lg:top-1/2 lg:w-auto lg:-translate-y-1/2"
                style={{ opacity: 0 }}
              >
                <GameCard game={game} index={i} active={hover === game.id} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
