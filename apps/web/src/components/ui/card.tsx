import * as React from 'react';
import { cn } from '@/lib/utils';

/* ---------------------------------- Card ---------------------------------- */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ hover = false, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl text-slate-100 transition-all duration-300',
          hover ? 'liquid-glass-interactive' : 'liquid-glass',
          className,
        )}
        {...props}
      />
    );
  },
);
Card.displayName = 'Card';

/* ------------------------------- CardHeader ------------------------------- */

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-between p-6 border-b border-white/10',
          className,
        )}
        {...props}
      />
    );
  },
);
CardHeader.displayName = 'CardHeader';

/* -------------------------------- CardTitle ------------------------------- */

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn('text-lg font-semibold text-white tracking-tight', className)}
        {...props}
      />
    );
  },
);
CardTitle.displayName = 'CardTitle';

/* ----------------------------- CardDescription ---------------------------- */

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn('text-sm text-slate-400', className)}
      {...props}
    />
  );
});
CardDescription.displayName = 'CardDescription';

/* ------------------------------- CardContent ------------------------------ */

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('p-6', className)}
        {...props}
      />
    );
  },
);
CardContent.displayName = 'CardContent';

/* ------------------------------- CardFooter ------------------------------- */

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center p-6 border-t border-white/10', className)}
        {...props}
      />
    );
  },
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
