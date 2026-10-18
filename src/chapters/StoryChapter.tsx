import { cn } from '@/lib/utils';
import type { ChapterCopy } from '@/config';
import { Chapter, ChapterLabel } from './Chapter';

export function StoryChapter({ chapter, height }: { chapter: ChapterCopy; height: string }) {
  const center = chapter.align === 'center';
  return (
    <Chapter id={chapter.id} height={height} align={chapter.align ?? 'left'} fadeIn={0.18} fadeOutAt={0.8}>
      <div className={cn('copy-scrim max-w-xl', center && 'mx-auto')}>
        <ChapterLabel index={chapter.index} label={chapter.label} className={cn(center && 'justify-center')} />
        <h2 className="font-display type-headline mt-6 text-ink">{chapter.heading}</h2>
        <p className={cn('type-lead mt-6', center ? 'mx-auto max-w-md' : 'max-w-md')}>{chapter.body}</p>
      </div>
    </Chapter>
  );
}
