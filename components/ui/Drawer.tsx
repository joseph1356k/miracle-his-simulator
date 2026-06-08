"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  testId,
  width = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  testId?: string;
  width?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const widths = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-xl" };

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-testid={testId}
        className={cn("absolute right-0 top-0 flex h-full w-full flex-col bg-white shadow-2xl animate-slide-in-right", widths[width])}
      >
        <div className="flex items-start justify-between gap-3 border-b border-ink-200 px-4 py-3">
          <div>
            <h2 className="text-base font-semibold text-ink-900">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-ink-500">{description}</p>}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar" data-testid="drawer-close">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-ink-200 bg-ink-50/60 px-4 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
