"use client";

import { useEffect, useState } from "react";
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
