import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  dot?: boolean;
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-white/10 text-slate-200 border border-white/10 backdrop-blur-md',
  success: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 backdrop-blur-md',
  warning: 'bg-amber-500/15 text-amber-300 border border-amber-500/30 backdrop-blur-md',
  error: 'bg-rose-500/15 text-rose-300 border border-rose-500/30 backdrop-blur-md',
  info: 'bg-blue-500/15 text-blue-300 border border-blue-500/30 backdrop-blur-md',
};

const dotColors: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-slate-400',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
};

const sizeStyles: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', size = 'sm', dot = false, className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-medium transition-colors duration-200',
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotColors[variant])}
          />
        )}
        {children}
      </span>
    );
  },
);

Badge.displayName = 'Badge';

export { Badge };
