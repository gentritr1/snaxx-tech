import { useRef, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useChapterReveal } from '@/hooks/useChapterReveal';

interface ChapterProps {
  id: string;
  /** Section height as a CSS length; the sticky stage inside is one viewport tall. */
  height: string;
  align?: 'left' | 'right' | 'center';
  fadeIn?: number;
  fadeOutAt?: number;
  className?: string;
  children: ReactNode;
  /** Rendered inside the stage but outside the fading copy (e.g. persistent labels). */
  stage?: ReactNode;
  style?: CSSProperties;
  /** Phones: sit the copy on the bottom of the screen (the 3D subject above it). */
  anchorBottomOnPhone?: boolean;
}

/** A scroll chapter: tall section, sticky viewport-high stage, fading copy. */
export function Chapter({ id, height, align = 'left', fadeIn, fadeOutAt, className, children, stage, style, anchorBottomOnPhone }: ChapterProps) {
  const section = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  useChapterReveal(section, copy, { fadeIn, fadeOutAt });

  return (
    <section id={id} ref={section} className={cn('relative', className)} style={{ height, ...style }}>
      <div className="chapter-stage">
        {stage}
        <div className={cn('container-large w-full px-6 lg:pl-12 lg:pr-32', anchorBottomOnPhone && 'self-end pb-6 lg:self-auto lg:pb-0 shortland:self-auto shortland:pb-0')}>
          <div
            ref={copy}
            className={cn(
              'chapter-copy flex w-full',
              align === 'left' && 'justify-start',
              align === 'right' && 'justify-end',
              align === 'center' && 'justify-center text-center',
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
