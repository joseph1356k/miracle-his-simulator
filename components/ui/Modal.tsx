"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  testId,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  testId?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const sizes = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <div className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-testid={testId}
        className={cn("relative z-10 w-full animate-scale-in rounded-xl border border-ink-200 bg-white shadow-2xl", sizes[size])}
      >
        <div className="flex items-start justify-between gap-3 border-b border-ink-200 px-5 py-3.5">
          <div>
            <h2 className="text-base font-semibold text-ink-900">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-ink-500">{description}</p>}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar" data-testid="modal-close">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-ink-200 bg-ink-50/60 px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
