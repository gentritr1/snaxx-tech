import { useCountUp } from '@/hooks/useMotion';
import { studioConfig } from '@/config';
import { Chapter, ChapterLabel } from './Chapter';

function Stat({ value, label }: { value: string; label: string }) {
  const { ref, display } = useCountUp<HTMLSpanElement>(value);
  return (
    <div>
      <span ref={ref} className="font-display block text-4xl font-medium tracking-[-0.03em] text-white lg:text-5xl">
        {display}
      </span>
      <span className="mt-1.5 block text-sm text-mist">{label}</span>
    </div>
  );
}

export function StudioChapter() {
  return (
    <Chapter id="studio" height="220vh" align="left" fadeIn={0.16} fadeOutAt={0.84}>
      <div className="grid w-full items-center gap-10 pt-20 lg:grid-cols-2 lg:gap-16 lg:pt-0">
        <div className="copy-scrim max-w-lg">
          <ChapterLabel index={studioConfig.index} label={studioConfig.label} />
          <h2 className="font-display type-headline mt-5 text-white">{studioConfig.heading}</h2>
          <p className="type-lead mt-5 max-w-md">{studioConfig.description}</p>
          <div className="mt-8 grid grid-cols-3 gap-6 border-t border-white/[0.08] pt-6">
            {studioConfig.stats.map((s) => (
              <Stat key={s.label} value={s.value} label={s.label} />
            ))}
          </div>
        </div>
        <ul className="glass hidden divide-y divide-white/[0.08] rounded-xl sm:block lg:justify-self-end lg:w-full lg:max-w-md">
          {studioConfig.principles.map((p, i) => (
            <li key={p.title} className="flex gap-5 p-5 lg:p-6">
              <span className="label-mono mt-1 text-ember">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3 className="text-base font-medium text-white">{p.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-mist">{p.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Chapter>
  );
}
