import { gamesConfig } from '@/config';
import { Chapter } from './Chapter';

export function PortalChapter() {
  return (
    <Chapter id="portal" height="140vh" align="center" fadeIn={0.16} fadeOutAt={0.72}>
      <div className="copy-scrim max-w-2xl">
        <h2 className="font-display type-display text-ink">{gamesConfig.portalHeading}</h2>
      </div>
    </Chapter>
  );
}
