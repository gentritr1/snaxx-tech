import { studioConfig } from '@/config';
import { Chapter } from './Chapter';

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <span className="font-display block text-4xl font-medium tracking-[-0.03em] text-ink lg:text-5xl">
        {value}
      </span>
      <span className="mt-1.5 block text-balance text-sm text-mist">{label}</span>
    </div>
  );
}

export function StudioChapter() {
  return (
    <Chapter id="studio" height="160vh" align="left" fadeIn={0.16} fadeOutAt={0.84}>
      <div className="grid w-full items-center gap-10 pt-20 lg:grid-cols-2 lg:gap-16 lg:pt-0 shortland:pt-16">
        <div className="copy-scrim max-w-lg">
          <h2 className="font-display type-headline text-ink">{studioConfig.heading}</h2>
          <p className="type-lead mt-5 max-w-md">{studioConfig.description}</p>
          <div className="mt-10 grid grid-cols-3 gap-6">
            {studioConfig.stats.map((s) => (
              <Stat key={s.label} value={s.value} label={s.label} />
            ))}
          </div>
        </div>
        <ul className="glass hidden rounded-xl py-2 sm:block lg:justify-self-end lg:w-full lg:max-w-md shortland:hidden">
          {studioConfig.principles.map((p) => (
            <li key={p.title} className="px-5 py-3 lg:px-6 lg:py-4">
              <div>
                <h3 className="text-base font-medium text-ink">{p.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-mist">{p.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Chapter>
  );
}
