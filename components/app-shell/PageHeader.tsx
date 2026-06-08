"use client";

import { cn } from "@/lib/utils/cn";

export function PageHeader({
  title,
  description,
  icon,
  actions,
  badge,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-clinical-50 text-clinical-600">
            {icon}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-ink-900">{title}</h1>
            {badge}
          </div>
          {description && <p className="mt-0.5 text-sm text-ink-500">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Standard page container padding used by every route. */
export function PageContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1500px] space-y-5 p-4 sm:p-6", className)}>{children}</div>;
}
