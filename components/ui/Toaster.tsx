"use client";

import { CheckCircle2, AlertTriangle, XCircle, Info, Bell, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useUI, type ToastVariant } from "@/lib/store/useUI";

const ICONS: Record<ToastVariant, React.ReactNode> = {
  default: <Bell className="h-4 w-4" />,
  success: <CheckCircle2 className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
  danger: <XCircle className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />,
};

const TONES: Record<ToastVariant, string> = {
  default: "border-ink-200 text-ink-700",
  success: "border-emerald-200 text-emerald-700",
  warning: "border-amber-200 text-amber-700",
  danger: "border-rose-200 text-rose-700",
  info: "border-clinical-200 text-clinical-700",
};

export function Toaster() {
  const toasts = useUI((s) => s.toasts);
  const dismiss = useUI((s) => s.dismissToast);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2" aria-live="polite" data-testid="toaster">
      {toasts.map((t) => (
        <div
          key={t.id}
          data-testid={`toast-${t.variant}`}
          className={cn("pointer-events-auto flex items-start gap-2.5 rounded-lg border bg-white px-3.5 py-3 shadow-lg animate-scale-in", TONES[t.variant])}
        >
          <span className="mt-0.5">{ICONS[t.variant]}</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-ink-900">{t.title}</p>
            {t.description && <p className="mt-0.5 text-xs text-ink-500">{t.description}</p>}
          </div>
          <button onClick={() => dismiss(t.id)} aria-label="Cerrar notificación" className="text-ink-400 hover:text-ink-700">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
