"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ALL_NAV_ITEMS } from "@/lib/config/nav";
import { createPortal } from "react-dom";
import { Activity } from "lucide-react";
import { Sidebar } from "@/components/app-shell/Sidebar";
import { Topbar } from "@/components/app-shell/Topbar";
import { PatientHeader } from "@/components/app-shell/PatientHeader";
import { CommandPalette } from "@/components/app-shell/CommandPalette";
import { AuditPanel } from "@/components/app-shell/AuditPanel";
import { PatientSummaryDrawer } from "@/components/app-shell/PatientSummaryDrawer";
import { MiracleOverlay } from "@/components/miracle/MiracleOverlay";
import { Toaster } from "@/components/ui/Toaster";
import { useHospital } from "@/lib/store/useHospital";
import { useUI } from "@/lib/store/useUI";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const seedIfEmpty = useHospital((s) => s.seedIfEmpty);
  const setCommandOpen = useUI((s) => s.setCommandOpen);
  const toggleMiracle = useUI((s) => s.toggleMiracleOverlay);
  const toggleAudit = useUI((s) => s.toggleAuditPanel);

  const pathname = usePathname();
  useEffect(() => { document.title = `${screenTitle(pathname)} · Miracle Hospital HIS Simulator`; }, [pathname]);

  useEffect(() => {
    seedIfEmpty();
    setMounted(true);
  }, [seedIfEmpty]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (mod && !e.shiftKey && key === "k") { e.preventDefault(); setCommandOpen(true); }
      else if (mod && e.shiftKey && key === "m") { e.preventDefault(); toggleMiracle(); }
      else if (mod && e.shiftKey && key === "a") { e.preventDefault(); toggleAudit(); }
      else if (mod && !e.shiftKey && key === "s") { e.preventDefault(); window.dispatchEvent(new CustomEvent("miracle:save")); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setCommandOpen, toggleMiracle, toggleAudit]);

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-ink-100">
        <div className="flex flex-col items-center gap-3 text-ink-500">
          <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-xl bg-clinical-500 text-white">
            <Activity className="h-6 w-6" />
          </div>
          <p className="text-sm">Cargando simulador hospitalario…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-ink-100">
      <aside className="hidden w-64 shrink-0 lg:block" aria-label="Barra lateral">
        <Sidebar />
      </aside>

      {sidebarOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-ink-900/50" onClick={() => setSidebarOpen(false)} aria-hidden />
            <div className="absolute left-0 top-0 h-full w-64 animate-slide-in-right">
              <Sidebar onNavigate={() => setSidebarOpen(false)} />
            </div>
          </div>,
          document.body,
        )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenSidebar={() => setSidebarOpen(true)} />
        <PatientHeader />
        <main className="flex-1 overflow-y-auto" data-testid="main-content">{children}</main>
      </div>

      <CommandPalette />
      <AuditPanel />
      <PatientSummaryDrawer />
      <MiracleOverlay />
      <Toaster />
    </div>
  );
}

/** Window title per screen: UI-automation agents read the browser window title to know where they are. */
const SUB_SCREENS: [string, string][] = [
  ["/emergency/triage", "Triage de enfermería"],
  ["/emergency/encounter/", "Nota médica de urgencias"],
  ["/outpatient/consultation/", "Nota de consulta (SOAP)"],
  ["/outpatient/schedule", "Agenda de consulta externa"],
  ["/inpatient/encounter/", "Encuentro de hospitalización"],
  ["/inpatient/bed-board", "Mapa de camas"],
  ["/orders/new", "Nueva orden médica"],
  ["/discharge/", "Epicrisis de egreso"],
  ["/surgery/case/", "Nota operatoria"],
  ["/nursing/vitals", "Enfermería · Signos vitales"],
  ["/nursing/notes", "Enfermería · Notas"],
  ["/nursing/tasks", "Enfermería · Tareas"],
];
function screenTitle(pathname: string): string {
  const sub = SUB_SCREENS.find(([prefix]) => pathname.startsWith(prefix));
  if (sub) return sub[1];
  if (/^\/patients\/(?!new)[^/]+$/.test(pathname)) return "Ficha del paciente";
  const nav = ALL_NAV_ITEMS.filter((i) => pathname.startsWith(i.href)).sort((a, b) => b.href.length - a.href.length)[0];
  return nav?.label ?? "Inicio";
}
