'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeStyles: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
}: ModalProps) {
  const [mounted, setMounted] = React.useState(false);
  const titleId = React.useId();
  const descId = React.useId();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Lock body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'transition-all duration-300',
        open
          ? 'opacity-100 pointer-events-auto'
          : 'opacity-0 pointer-events-none',
      )}
      aria-hidden={!open}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Content */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        className={cn(
          'relative w-full rounded-2xl bg-[#0e1424]/95 border border-white/15 text-slate-100 backdrop-blur-2xl shadow-2xl',
          'transition-all duration-300',
          open ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
          sizeStyles[size],
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex flex-col gap-1">
              {title && (
                <h2
                  id={titleId}
                  className="text-lg font-bold text-white tracking-tight"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id={descId}
                  className="text-sm text-slate-400"
                >
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors duration-200"
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
