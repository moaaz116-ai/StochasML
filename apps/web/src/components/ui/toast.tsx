'use client';

import { useToastStore } from '@/stores/toast-store';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-md w-full">
      {toasts.map((t) => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
          info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
        };

        const bgColors = {
          success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          error: 'bg-rose-50 border-rose-200 text-rose-900',
          info: 'bg-blue-50 border-blue-200 text-blue-900',
        };

        return (
          <div
            key={t.id}
            className={`flex items-start justify-between gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md animate-fade-in-up transition-all ${bgColors[t.type]}`}
          >
            <div className="flex gap-2.5 items-start">
              {icons[t.type]}
              <span className="text-sm font-medium leading-relaxed">{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded-lg transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
