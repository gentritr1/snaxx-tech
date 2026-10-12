import { useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
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

/** Studio button: the label rolls on hover, the arrow nudges. */
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
  const [isHovered, setIsHovered] = useState(false);

  const baseStyles = cn(
    'pressable relative inline-flex min-h-11 items-center justify-center gap-2 overflow-hidden rounded-lg font-geist text-sm font-medium tracking-[-0.01em]',
    'transition-[background-color,border-color,color,box-shadow] duration-300 ease-out-quad focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-void',
    {
      'bg-silver text-ink hover:bg-white': variant === 'primary',
      'glass text-silver hover:border-white/25': variant === 'secondary',
      'border border-white/25 bg-transparent text-silver hover:border-white/70': variant === 'outline',
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
        <span className={cn('block transition-transform duration-350 ease-out-quad', isHovered ? '-translate-y-[150%]' : 'translate-y-0')}>
          {children}
        </span>
        <span
          aria-hidden="true"
          className={cn('absolute inset-0 flex items-center transition-transform duration-350 ease-out-quad', isHovered ? 'translate-y-0' : 'translate-y-[150%]')}
        >
          {children}
        </span>
      </span>
      {showIcon && (
        <ArrowRight
          aria-hidden="true"
          className={cn('h-4 w-4 transition-transform duration-300 ease-out-quad', isHovered ? 'translate-x-1' : 'translate-x-0')}
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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {content}
    </button>
  );
}
