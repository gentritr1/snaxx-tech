import { Circle, Gamepad2, HeartHandshake, ShieldCheck, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScrollAnimation, useStaggerAnimation } from '@/hooks/useScrollAnimation';
import { servicesConfig, type ServiceItem } from '@/config';

/* Decorative only — drives the hover wash and the plaque underline, never text.
   Sampled from the almanac palette: gold, rust, blue, olive. */
const SERVICE_ACCENTS = ['#C9A86A', '#BD9161', '#4D7094', '#6D5844'];
/* Ink tones for the icons themselves — both text-safe on paper. */
const SERVICE_ICON_INKS = ['text-almanac-ink', 'text-almanac-olive'];

function renderServiceIcon(iconName: string, colorClass: string) {
  const props = { className: cn('h-5 w-5', colorClass), 'aria-hidden': true } as const;

  switch (iconName) {
    case 'Gamepad2':
      return <Gamepad2 {...props} />;
    case 'HeartHandshake':
      return <HeartHandshake {...props} />;
    case 'ShieldCheck':
      return <ShieldCheck {...props} />;
    case 'Smartphone':
      return <Smartphone {...props} />;
    default:
      return <Circle {...props} />;
  }
}

function ServiceRow({ service, index, isVisible }: { service: ServiceItem; index: number; isVisible: boolean }) {
  const accent = SERVICE_ACCENTS[index % SERVICE_ACCENTS.length];
  const iconInk = SERVICE_ICON_INKS[index % SERVICE_ICON_INKS.length];

  return (
    <article
      className={cn(
        'service-row group grid gap-6 border-t border-dashed border-almanac-ink-faint py-8 transition-[opacity,transform] duration-700 ease-out-quart md:grid-cols-[3.5rem_minmax(0,1fr)_12rem] md:items-center lg:grid-cols-[4rem_minmax(0,1fr)_16rem] lg:py-9',
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
      )}
      style={{ '--service-accent': accent, transitionDelay: `${index * 80}ms` } as React.CSSProperties}
    >
      <div className="service-icon flex h-12 w-12 items-center justify-center rounded-lg border border-almanac-ink-faint bg-almanac-paper-card transition-colors duration-300">
        {renderServiceIcon(service.iconName, iconInk)}
      </div>

      <div className="max-w-2xl">
        <h3 className="font-display text-xl font-semibold tracking-[-0.025em] text-almanac-ink-strong sm:text-2xl">{service.title}</h3>
        <p className="mt-2 text-base leading-relaxed text-almanac-ink">{service.description}</p>
      </div>

      <div className="service-preview relative overflow-hidden rounded-xl border border-almanac-ink-faint bg-almanac-paper-deep">
        <div className="aspect-[16/10]">
          <img
            src={service.image}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-[opacity,transform,filter] duration-500 ease-out-quart md:scale-105 md:opacity-55 md:saturate-50 md:group-hover:scale-100 md:group-hover:opacity-100 md:group-hover:saturate-100"
          />
        </div>
        <span className="absolute inset-x-0 bottom-0 h-1" style={{ backgroundColor: accent }} aria-hidden="true" />
      </div>
    </article>
  );
}

export function Services() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({ threshold: 0.3 });
  const { containerRef, visibleItems } = useStaggerAnimation(servicesConfig.services.length, 90);

  if (!servicesConfig.heading && servicesConfig.services.length === 0) return null;

  return (
    <section id="services" className="w-full bg-almanac-paper py-24 lg:py-32">
      <div className="container-large px-6 lg:px-12">
        <div ref={headerRef} className="mb-14 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <h2
            className={cn(
              'type-h2 max-w-3xl font-display font-semibold text-almanac-ink-strong transition-[opacity,transform] duration-700 ease-out-quart',
              headerVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0',
            )}
          >
            {servicesConfig.heading}
          </h2>
          <p
            className={cn(
              'max-w-sm text-base leading-relaxed text-almanac-ink-soft transition-[opacity,transform] duration-700 ease-out-quart',
              headerVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0',
            )}
            style={{ transitionDelay: '90ms' }}
          >
            We design, build, test, and keep listening after the first release.
          </p>
        </div>

        <div ref={containerRef} className="border-b border-dashed border-almanac-ink-faint">
          {servicesConfig.services.map((service, index) => (
            <ServiceRow key={service.title} service={service} index={index} isVisible={visibleItems[index]} />
          ))}
        </div>
      </div>
    </section>
  );
}
