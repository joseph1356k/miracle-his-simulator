"use client";

import { cn } from "@/lib/utils/cn";

export type BadgeTone =
  | "neutral" | "blue" | "green" | "amber" | "red" | "purple" | "slate" | "teal";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-ink-100 text-ink-700 border-ink-200",
  blue: "bg-clinical-50 text-clinical-700 border-clinical-200",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-rose-50 text-rose-700 border-rose-200",
  purple: "bg-violet-50 text-violet-700 border-violet-200",
  slate: "bg-slate-100 text-slate-700 border-slate-200",
  teal: "bg-teal-50 text-teal-700 border-teal-200",
};

export function Badge({
  tone = "neutral",
  className,
  children,
  dot,
  ...props
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
  dot?: boolean;
} & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-medium whitespace-nowrap",
        TONES[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}
