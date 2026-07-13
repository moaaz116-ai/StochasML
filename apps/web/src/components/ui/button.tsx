import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'liquid-glow-pill text-white shadow-lg cursor-pointer font-medium',
  secondary:
    'bg-white/10 hover:bg-white/15 text-white border border-white/15 backdrop-blur-md shadow-sm active:bg-white/20 cursor-pointer',
  outline:
    'border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 backdrop-blur-md cursor-pointer',
  ghost:
    'text-slate-300 hover:bg-white/10 hover:text-white active:bg-white/15 cursor-pointer',
  danger:
    'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 active:bg-rose-500/40 cursor-pointer',
};

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-6 text-lg gap-2.5 rounded-xl',
};

const Spinner = () => (
  <svg
    className="animate-spin h-4 w-4"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      children,
      className,
      icon,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-200 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f]',
          'disabled:pointer-events-none disabled:opacity-50',
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        type={type}
        {...props}
      >
        {loading ? <Spinner /> : icon ? <span className="shrink-0">{icon}</span> : null}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';

export { Button };
