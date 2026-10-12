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
}

/** A scroll chapter: tall section, sticky viewport-high stage, fading copy. */
export function Chapter({ id, height, align = 'left', fadeIn, fadeOutAt, className, children, stage, style }: ChapterProps) {
  const section = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  useChapterReveal(section, copy, { fadeIn, fadeOutAt });

  return (
    <section id={id} ref={section} className={cn('relative', className)} style={{ height, ...style }}>
      <div className="chapter-stage">
        {stage}
        <div className="container-large w-full px-6 lg:px-12">
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

export function ChapterLabel({ index, label, className }: { index: string; label: string; className?: string }) {
  return (
    <p className={cn('label-mono flex items-center gap-3 text-mist', className)}>
      <span className="text-ember">{index}</span>
      <span className="h-px w-6 bg-white/20" aria-hidden="true" />
      <span>{label}</span>
    </p>
  );
}
