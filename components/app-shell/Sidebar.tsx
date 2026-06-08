"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { NAV_GROUPS, moduleForPath } from "@/lib/config/nav";
import { roleCanSee } from "@/lib/config/roles";
import { useCurrentRole } from "@/lib/store/useSession";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const role = useCurrentRole();
  const activeModule = moduleForPath(pathname);

  return (
    <div className="flex h-full flex-col bg-ink-900 text-ink-100">
      {/* Brand */}
      <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-3.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-clinical-500 text-white shadow-inner">
          <Activity className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">San Rafael HIS</p>
          <p className="truncate text-2xs text-ink-400">Miracle Simulator</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Navegación principal">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((i) => roleCanSee(role, i.key));
          if (items.length === 0) return null;
          return (
            <div key={group.title} className="mb-3">
              <p className="px-3 pb-1.5 text-2xs font-semibold uppercase tracking-wider text-ink-500">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = activeModule === item.key;
                  return (
                    <li key={item.key}>
                      <Link
                        href={item.href}
                        data-testid={item.testId}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition",
                          active
                            ? "bg-clinical-600 text-white shadow-sm"
                            : "text-ink-300 hover:bg-white/5 hover:text-white",
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-ink-400 group-hover:text-white")} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Disclaimer footer */}
      <div className="border-t border-white/10 px-3 py-3">
        <div className="flex items-start gap-2 rounded-md bg-amber-500/10 px-2.5 py-2 text-2xs text-amber-200">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>Simulador de prueba. Datos sintéticos. No usar para atención real.</span>
        </div>
      </div>
    </div>
  );
}
