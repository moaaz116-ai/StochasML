import * as React from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 py-12',
        className,
      )}
    >
      <div className="rounded-2xl bg-white/5 border border-white/10 p-4 backdrop-blur-md shadow-inner">
        <Icon className="h-8 w-8 text-blue-400" strokeWidth={1.5} />
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        {description && (
          <p className="text-sm text-slate-400 max-w-sm text-center leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
