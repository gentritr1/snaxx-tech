import { gamesConfig } from '@/config';
import { Chapter, ChapterLabel } from './Chapter';

export function PortalChapter() {
  return (
    <Chapter id="portal" height="160vh" align="center" fadeIn={0.16} fadeOutAt={0.72}>
      <div className="copy-scrim max-w-2xl">
        <ChapterLabel index={gamesConfig.index} label={gamesConfig.portalLabel} className="justify-center" />
        <h2 className="font-display type-display mt-6 text-ink">{gamesConfig.portalHeading}</h2>
      </div>
    </Chapter>
  );
}
