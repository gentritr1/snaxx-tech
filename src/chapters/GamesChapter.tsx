import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { gamesConfig, type GameItem } from '@/config';
import { setHover, subscribeHover } from '@/experience/sceneState';
import { useSequenceReveal } from '@/hooks/useChapterReveal';
import { gsap } from '@/experience/scroll';
import { prefersReducedMotion } from '@/experience/quality';

function GameCard({ game, active }: { game: GameItem; active: boolean }) {
  const linkClass =
    'pressable inline-flex min-h-11 items-center gap-2 rounded-lg border border-ink/15 px-3.5 text-sm font-medium text-ink transition-colors hover:border-ink/40 hover:text-ink';
  return (
    <article
      className="product-accent product-ring glass w-full max-w-md rounded-xl p-6 transition-[border-color,box-shadow] duration-300 ease-out-quart lg:p-7"
      style={{ '--accent': game.accent } as CSSProperties}
      data-active={active ? 'true' : 'false'}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(game.id)}
      onPointerLeave={() => setHover(null)}
      aria-labelledby={`game-${game.id}-title`}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="label flex items-center gap-2.5 text-mist">
          <span className="product-dot" aria-hidden="true" />
          {game.status}
        </p>
      </div>
      <h3 id={`game-${game.id}-title`} className="font-display type-title mt-5 text-ink">
        {game.name}
      </h3>
      <p className="mt-1 text-sm text-ink/75">{game.category}</p>
      <p className="mt-4 text-sm leading-relaxed text-mist">{game.description}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {game.href && (
          <a href={game.href} target="_blank" rel="noopener noreferrer" className={cn(linkClass, 'bg-ink text-cream hover:bg-cocoa hover:text-cream')}>
            {game.actionLabel ?? 'Open'}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        )}
        {game.legalSlug && (
          <Link to={`/legal#${game.legalSlug}`} className={linkClass}>
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Privacy & terms
          </Link>
        )}
      </div>
    </article>
  );
}

export function GamesChapter() {
  const section = useRef<HTMLElement>(null);
  const header = useRef<HTMLDivElement>(null);
  const intro = useRef<HTMLParagraphElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const [hover, setLocal] = useState<string | null>(null);
  // Reduced motion shows every game at once in normal document flow; the
  // animated layout stacks the cards on top of each other and reveals one at
  // a time, which would hide all but the last card from these visitors.
  const [reduced] = useState(prefersReducedMotion);
  useEffect(() => subscribeHover(setLocal), []);
  useSequenceReveal(section, cards, gamesConfig.games.length);

  // Persistent chapter header: in at the start, out at the very end.
  useEffect(() => {
    const sectionEl = section.current;
    const el = header.current;
    if (!sectionEl || !el) return;
    if (reduced) {
      gsap.set(el, { opacity: 1 });
      return;
    }
    const tl = gsap.timeline({ scrollTrigger: { trigger: sectionEl, start: 'top top', end: 'bottom bottom', scrub: true } });
    tl.fromTo(el, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.05, ease: 'power2.out' }, 0.01);
    if (intro.current) tl.to(intro.current, { opacity: 0, y: -12, duration: 0.04, ease: 'power2.in' }, 0.2);
    tl.to(el, { opacity: 0, y: -20, duration: 0.05, ease: 'power2.in' }, 0.94);
    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [reduced]);

  return (
    <section id="games" ref={section} className="relative" style={reduced ? undefined : { height: '360vh' }}>
      <div className={cn('chapter-stage', reduced && 'chapter-flow')}>
        <div className={cn('container-large w-full px-6 lg:pl-12 lg:pr-32', !reduced && 'relative h-full')}>
          <div
            ref={header}
            className={cn('chapter-copy max-w-sm', !reduced && 'absolute left-6 top-20 sm:top-24 lg:left-12 lg:top-28')}
          >
            <h2 className="font-display type-title text-ink">{gamesConfig.heading}</h2>
            <p ref={intro} className={cn('mt-3 text-sm leading-relaxed text-ink/80', !reduced && 'hidden lg:block')}>{gamesConfig.description}</p>
          </div>

          <div
            className={cn(
              reduced
                ? 'mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4'
                : 'absolute inset-x-6 bottom-8 flex justify-start lg:inset-x-12 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2',
            )}
          >
            {gamesConfig.games.map((game, i) => (
              <div
                key={game.id}
                ref={(el) => {
                  cards.current[i] = el;
                }}
                className={cn(
                  'chapter-copy',
                  reduced ? 'w-full' : 'absolute bottom-0 left-0 w-full lg:top-1/2 lg:w-auto lg:-translate-y-1/2',
                )}
                // Hidden until its slice of the scroll: not just transparent but
                // out of the tab order too, so keyboard focus never lands on a
                // card nobody can see.
                style={reduced ? undefined : { opacity: 0, visibility: 'hidden' }}
              >
                <GameCard game={game} active={hover === game.id} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
