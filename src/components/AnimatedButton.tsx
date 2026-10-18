import type { CSSProperties, MouseEvent, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface AnimatedButtonProps {
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  href?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'outline-dark';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
  style?: CSSProperties;
  external?: boolean;
}

/** Studio button: the label rolls on hover, the arrow nudges. Hover is CSS
 *  (group-hover), which Tailwind only applies on devices that can hover, so a
 *  tap on a phone no longer leaves the label rolled. */
export function AnimatedButton({
  children,
  onClick,
  href,
  variant = 'primary',
  size = 'md',
  showIcon = false,
  className,
  style,
  external,
}: AnimatedButtonProps) {
  const baseStyles = cn(
    'pressable group relative inline-flex min-h-11 items-center justify-center gap-2 overflow-hidden rounded-lg font-geist text-sm font-medium tracking-[-0.01em]',
    'transition-[background-color,border-color,color,box-shadow] duration-300 ease-out-quad focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6BFF] focus-visible:ring-offset-2 focus-visible:ring-offset-void',
    {
      'bg-ink text-cream hover:bg-cocoa': variant === 'primary',
      'glass text-ink hover:border-ink/30': variant === 'secondary',
      'border border-ink/25 bg-transparent text-ink hover:border-ink/60': variant === 'outline',
      'border border-ink/40 bg-transparent text-ink hover:bg-ink hover:text-paper focus-visible:ring-[#2F6BFF] focus-visible:ring-offset-paper':
        variant === 'outline-dark',
      'px-4 py-2 text-xs': size === 'sm',
      'px-5 py-3': size === 'md',
      'px-7 py-4 text-base': size === 'lg',
    },
    className,
  );

  const content = (
    <>
      <span className="relative flex h-5 items-center overflow-hidden">
        <span className="block transition-transform duration-350 ease-out-quad group-hover:-translate-y-[150%]">
          {children}
        </span>
        <span
          aria-hidden="true"
          className="absolute inset-0 flex translate-y-[150%] items-center transition-transform duration-350 ease-out-quad group-hover:translate-y-0"
        >
          {children}
        </span>
      </span>
      {showIcon && (
        <ArrowRight
          aria-hidden="true"
          className="h-4 w-4 transition-transform duration-300 ease-out-quad group-hover:translate-x-1"
        />
      )}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={baseStyles}
        style={style}
        onClick={onClick}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={baseStyles}
      style={style}
    >
      {content}
    </button>
  );
}
