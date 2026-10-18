import { useEffect, useState, type CSSProperties, type MouseEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { softwareConfig, type SoftwareProduct } from '@/config';
import { setHover, subscribeHover } from '@/experience/sceneState';
import { scrollToHash } from '@/lib/scroll';
import { Chapter } from './Chapter';

function useHoverSync() {
  const [hover, setLocal] = useState<string | null>(null);
  useEffect(() => subscribeHover(setLocal), []);
  return hover;
}

function ProductCard({ product, active, compact }: { product: SoftwareProduct; active: boolean; compact?: boolean }) {
  const onAction = (e: MouseEvent<HTMLAnchorElement>) => {
    if (product.href?.startsWith('#')) {
      e.preventDefault();
      scrollToHash(product.href);
    }
  };
  return (
    <article
      className={cn('product-accent product-ring glass rounded-xl p-5 transition-[border-color,box-shadow] duration-300 ease-out-quart lg:p-6', compact && 'p-4 lg:p-5 shortland:hidden')}
      style={{ '--accent': product.accent } as CSSProperties}
      data-active={active ? 'true' : 'false'}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(product.id)}
      onPointerLeave={() => setHover(null)}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="product-dot" aria-hidden="true" />
          <h3 className={cn('font-display font-medium tracking-[-0.02em] text-ink', compact ? 'text-lg' : 'text-2xl')}>{product.name}</h3>
        </div>
        <span className="label text-mist">{product.status}</span>
      </div>
      <p className={cn('mt-2 text-ink/80', compact ? 'text-sm' : 'text-base')}>{product.tagline}</p>
      {!compact && <p className="mt-3 hidden text-sm leading-relaxed text-mist sm:block short:hidden">{product.description}</p>}
      {product.features.length > 0 && (
        <ul className={cn('mt-4 gap-x-5 gap-y-2.5 sm:mt-5 sm:gap-y-3 shortland:hidden', compact ? 'hidden grid-cols-1 sm:grid short:hidden' : 'grid grid-cols-2')}>
          {product.features.map((f) => (
            <li key={f.title}>
              <p className="text-sm font-medium text-ink">{f.title}</p>
              {!compact && <p className="mt-0.5 hidden text-[0.8125rem] leading-snug text-mist sm:block">{f.body}</p>}
            </li>
          ))}
        </ul>
      )}
      {product.href && product.actionLabel && (
        <a
          href={product.href}
          onClick={onAction}
          className="group mt-5 inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium text-ink transition-colors hover:text-ink"
        >
          {product.actionLabel}
          <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out-quart group-hover:translate-x-1" aria-hidden="true" />
        </a>
      )}
    </article>
  );
}

export function SoftwareChapter() {
  const hover = useHoverSync();
  const [primary, ...rest] = softwareConfig.products;
  return (
    <Chapter id="software" height="280vh" align="right" fadeIn={0.14} fadeOutAt={0.84}>
      <div className="w-full max-w-md pt-16 sm:pt-20 lg:pt-0 shortland:pt-0">
        <h2 className="font-display type-headline text-ink">{softwareConfig.heading}</h2>
        <p className="type-lead mt-4 hidden sm:block [@media(max-height:820px)]:hidden">{softwareConfig.description}</p>
        <div className="mt-5 space-y-3 sm:mt-7">
          {primary && <ProductCard product={primary} active={hover === primary.id} />}
          {rest.map((p) => (
            <ProductCard key={p.id} product={p} active={hover === p.id} compact />
          ))}
        </div>
      </div>
    </Chapter>
  );
}
