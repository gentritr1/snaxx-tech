import { cn } from '@/lib/utils';
import { useScrollAnimation, useStaggerAnimation } from '@/hooks/useScrollAnimation';
import { useCountUp } from '@/hooks/useMotion';
import { aboutConfig } from '@/config';

// Single stat number that counts up from 0 when scrolled into view (once).
function StatValue({ value }: { value: string }) {
  const { ref, display } = useCountUp<HTMLSpanElement>(value);
  return (
    <span ref={ref} className="block text-3xl font-semibold text-exvia-black">
      {display}
    </span>
  );
}

export function About() {
  const { ref: sectionRef, isVisible: sectionVisible } = useScrollAnimation({ threshold: 0.2 });
  const { containerRef: imagesRef, visibleItems } = useStaggerAnimation(aboutConfig.images.length || 4, 150);

  if (!aboutConfig.description && aboutConfig.stats.length === 0 && aboutConfig.images.length === 0) return null;

  return (
    <section id="about" className="w-full py-24 lg:py-32 bg-white">
      <div className="container-large px-6 lg:px-12">
        <div ref={sectionRef} className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          {/* Left Column - Text Content */}
          <div className="space-y-8">
            {aboutConfig.heading && (
              <h2
                className={cn(
                  'type-h2 max-w-xl font-semibold text-exvia-black transition-all duration-700 ease-out-quart',
                  sectionVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0',
                )}
              >
                {aboutConfig.heading}
              </h2>
            )}

            {/* Main Text */}
            {aboutConfig.description && (
              <div
                className={cn(
                  'transition-all duration-700 ease-out-quart',
                  sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                )}
                style={{ transitionDelay: '100ms' }}
              >
                <p className="max-w-2xl text-lg leading-relaxed text-exvia-black/75 lg:text-xl">
                  {aboutConfig.description}
                </p>
              </div>
            )}

            {/* Experience Badge */}
            {aboutConfig.experienceValue && (
              <div
                className={cn(
                  'flex items-end gap-3 pt-4 transition-all duration-800 ease-out-quart',
                  sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                )}
                style={{ transitionDelay: '200ms' }}
              >
                <span className="text-7xl lg:text-8xl font-black text-exvia-black leading-none">
                  {aboutConfig.experienceValue}
                </span>
                {aboutConfig.experienceLabel && (
                  <span className="text-sm text-exvia-black/60 pb-3">
                    {aboutConfig.experienceLabel}
                  </span>
                )}
              </div>
            )}

            {/* Stats */}
            {aboutConfig.stats.length > 0 && (
              <div
                className={cn(
                  'grid grid-cols-1 gap-6 border-t border-exvia-border pt-8 transition-all duration-700 ease-out-quart sm:grid-cols-3 sm:gap-8',
                  sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                )}
                style={{ transitionDelay: '300ms' }}
              >
                {aboutConfig.stats.map((stat, index) => (
                  <div key={index} className="max-w-[12rem]">
                    <StatValue value={stat.value} />
                    <span className="mt-1 block text-sm leading-snug text-exvia-black/65">{stat.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Image Grid */}
          {aboutConfig.images.length > 0 && (
            <div ref={imagesRef} className="grid grid-cols-2 gap-4">
              {aboutConfig.images.map((image, index) => (
                <div
                  key={index}
                  className={cn(
                    'relative overflow-hidden rounded-xl transition-all duration-700 ease-out-quart',
                    index % 2 === 1 ? 'mt-8' : '',
                    visibleItems[index] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  )}
                >
                  <div className="group relative aspect-[4/5]">
                    <img
                      src={image.src}
                      alt={image.alt}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 ease-out-quad group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-exvia-black/0 group-hover:bg-exvia-black/10 transition-colors duration-300" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
