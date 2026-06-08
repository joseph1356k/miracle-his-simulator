"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { toTestId } from "@/lib/utils/format";

export interface TabDef {
  key: string;
  label: string;
  testId?: string;
  badge?: React.ReactNode;
  content: React.ReactNode;
}

export function Tabs({
  tabs,
  defaultTab,
  className,
  onChange,
}: {
  tabs: TabDef[];
  defaultTab?: string;
  className?: string;
  onChange?: (key: string) => void;
}) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.key);
  const activeTab = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label="Secciones"
        className="flex gap-1 overflow-x-auto border-b border-ink-200 pb-px"
      >
        {tabs.map((t) => {
          const selected = t.key === active;
          return (
            <button
              key={t.key}
              role="tab"
              id={`tab-${t.key}`}
              aria-selected={selected}
              aria-controls={`tabpanel-${t.key}`}
              data-testid={t.testId ?? `tab-${toTestId(t.key)}`}
              onClick={() => { setActive(t.key); onChange?.(t.key); }}
              className={cn(
                "relative whitespace-nowrap rounded-t-md px-3 py-2 text-sm font-medium transition focus-ring",
                selected
                  ? "text-clinical-700"
                  : "text-ink-500 hover:text-ink-800 hover:bg-ink-50",
              )}
            >
              <span className="flex items-center gap-1.5">
                {t.label}
                {t.badge}
              </span>
              {selected && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-clinical-600" />}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`tabpanel-${activeTab?.key}`}
        aria-labelledby={`tab-${activeTab?.key}`}
        data-testid={`tabpanel-${toTestId(activeTab?.key ?? "")}`}
        className="pt-4"
      >
        {activeTab?.content}
      </div>
    </div>
  );
}
