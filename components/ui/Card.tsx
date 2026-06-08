"use client";

import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("section-card", className)} {...props} />;
}

export function CardHeader({
  title,
  subtitle,
  actions,
  icon,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3 border-b border-ink-200 px-4 py-3", className)}>
      <div className="flex items-start gap-2.5">
        {icon && <div className="mt-0.5 text-clinical-600">{icon}</div>}
        <div>
          <h3 className="section-title">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4", className)} {...props} />;
}

/** Section block used heavily inside the dense clinical forms. */
export function Section({
  title,
  description,
  children,
  actions,
  className,
  testId,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <section className={cn("section-card", className)} data-testid={testId} aria-label={title}>
      <div className="flex items-center justify-between gap-2 border-b border-ink-200 bg-ink-50/60 px-4 py-2.5">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-600">{title}</h4>
        {actions}
      </div>
      {description && <p className="px-4 pt-3 text-xs text-ink-500">{description}</p>}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "default",
  icon,
  onClick,
  testId,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "default" | "blue" | "green" | "amber" | "red";
  icon?: React.ReactNode;
  onClick?: () => void;
  testId?: string;
}) {
  const tones: Record<string, string> = {
    default: "border-ink-200",
    blue: "border-clinical-200 bg-clinical-50/40",
    green: "border-emerald-200 bg-emerald-50/40",
    amber: "border-amber-200 bg-amber-50/40",
    red: "border-rose-200 bg-rose-50/40",
  };
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      data-testid={testId}
      onClick={onClick}
      className={cn(
        "flex flex-col gap-1 rounded-lg border bg-white p-3.5 text-left shadow-sm transition",
        tones[tone],
        onClick && "hover:shadow-md hover:-translate-y-px focus-ring",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink-500">{label}</span>
        {icon && <span className="text-ink-400">{icon}</span>}
      </div>
      <span className="text-2xl font-semibold text-ink-900">{value}</span>
      {hint && <span className="text-2xs text-ink-400">{hint}</span>}
    </Comp>
  );
}
