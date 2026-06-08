"use client";

import { useEffect, useState } from "react";
import { Bell, Clock, FlaskConical, Menu, Search, ShieldAlert, ClipboardSignature, MapPin } from "lucide-react";
import { ROLES } from "@/lib/config/roles";
import { useSession } from "@/lib/store/useSession";
import { useHospital } from "@/lib/store/useHospital";
import { useUI } from "@/lib/store/useUI";
import { Badge } from "@/components/ui/Badge";

const LOCATIONS = [
  "Hospital Universitario San Rafael — Sede Central",
  "San Rafael — Sede Norte",
  "San Rafael — Centro Ambulatorio",
];

export function Topbar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { roleId, setRole, userName, shift, location, setLocation } = useSession();
  const data = useHospital((s) => s.data);
  const setCommandOpen = useUI((s) => s.setCommandOpen);
  const toggleMiracle = useUI((s) => s.toggleMiracleOverlay);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(t);
  }, []);

  const pendingOrders = data.orders.filter((o) => o.status === "draft" || o.status === "signed").length;
  const criticalAlerts =
    data.labs.filter((l) => l.results?.some((r) => r.flag === "critico")).length +
    data.imaging.filter((i) => i.criticalFinding).length;

  const role = ROLES.find((r) => r.id === roleId);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-ink-200 bg-white/95 px-3 backdrop-blur sm:px-4">
      <button onClick={onOpenSidebar} className="rounded-md p-2 text-ink-600 hover:bg-ink-100 lg:hidden" aria-label="Abrir menú" data-testid="button-open-sidebar">
        <Menu className="h-5 w-5" />
      </button>

      {/* Global search */}
      <button
        onClick={() => setCommandOpen(true)}
        data-testid="global-search"
        className="flex h-9 max-w-md flex-1 items-center gap-2 rounded-md border border-ink-200 bg-ink-50 px-3 text-sm text-ink-400 hover:border-ink-300"
        aria-label="Búsqueda global"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Buscar paciente, encuentro, módulo…</span>
        <kbd className="hidden rounded border border-ink-300 bg-white px-1.5 py-0.5 text-2xs text-ink-500 sm:inline">Ctrl K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        {/* Role selector */}
        <label className="hidden items-center gap-1.5 md:flex">
          <span className="sr-only">Rol activo</span>
          <select
            data-testid="role-selector"
            aria-label="Rol activo"
            value={roleId}
            onChange={(e) => setRole(e.target.value as typeof roleId)}
            className="h-9 rounded-md border border-ink-200 bg-white px-2 text-sm text-ink-700 focus-ring"
          >
            {ROLES.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </label>

        {/* Location selector */}
        <label className="hidden items-center gap-1.5 xl:flex">
          <MapPin className="h-4 w-4 text-ink-400" />
          <span className="sr-only">Sede</span>
          <select
            data-testid="location-selector"
            aria-label="Sede"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="h-9 max-w-[200px] rounded-md border border-ink-200 bg-white px-2 text-xs text-ink-600 focus-ring"
          >
            {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>

        {/* Shift */}
        <span className="hidden items-center gap-1 rounded-md bg-ink-50 px-2 py-1.5 text-2xs text-ink-500 xl:flex" data-testid="current-shift">
          <Clock className="h-3.5 w-3.5" /> {shift}
        </span>

        {/* Pending orders */}
        <button className="relative hidden items-center gap-1 rounded-md border border-ink-200 px-2 py-1.5 text-2xs text-ink-600 hover:bg-ink-50 sm:flex" data-testid="pending-orders-count" aria-label={`${pendingOrders} órdenes pendientes`}>
          <ClipboardSignature className="h-3.5 w-3.5" />
          {pendingOrders}
        </button>

        {/* Critical alerts */}
        <button className="relative flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1.5 text-2xs font-medium text-rose-700 hover:bg-rose-100" data-testid="critical-alerts-count" aria-label={`${criticalAlerts} alertas críticas`}>
          <ShieldAlert className="h-3.5 w-3.5" />
          {criticalAlerts}
        </button>

        {/* Notifications */}
        <button className="relative rounded-md p-2 text-ink-500 hover:bg-ink-100" aria-label="Notificaciones" data-testid="notifications">
          <Bell className="h-4 w-4" />
          {(pendingOrders + criticalAlerts) > 0 && (
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-rose-500" />
          )}
        </button>

        {/* Miracle overlay toggle */}
        <button onClick={toggleMiracle} className="rounded-md p-2 text-violet-500 hover:bg-violet-50" aria-label="Panel Miracle QA" data-testid="button-miracle-overlay" title="Panel Miracle (Ctrl+Shift+M)">
          <FlaskConical className="h-4 w-4" />
        </button>

        {/* User */}
        <div className="flex items-center gap-2 border-l border-ink-200 pl-2" data-testid="user-menu">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-clinical-100 text-xs font-semibold text-clinical-700">
            {userName.split(" ").map((p) => p[0]).slice(0, 2).join("")}
          </div>
          <div className="hidden leading-tight lg:block">
            <p className="text-xs font-medium text-ink-900">{userName}</p>
            <p className="text-2xs text-ink-500">{role?.label}</p>
          </div>
        </div>

        {/* Clock */}
        <span className="hidden tabular-nums text-2xs text-ink-400 sm:inline" data-testid="topbar-clock">
          {now ? now.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
        </span>
      </div>
    </header>
  );
}
