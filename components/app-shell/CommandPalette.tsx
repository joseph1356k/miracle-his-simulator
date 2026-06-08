"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Search, UserRound, ArrowRight, LayoutGrid } from "lucide-react";
import { useUI } from "@/lib/store/useUI";
import { useSession } from "@/lib/store/useSession";
import { useHospital } from "@/lib/store/useHospital";
import { ALL_NAV_ITEMS } from "@/lib/config/nav";
import { ageFromBirthDate, fullName } from "@/lib/utils/format";

export function CommandPalette() {
  const open = useUI((s) => s.commandOpen);
  const setOpen = useUI((s) => s.setCommandOpen);
  const selectPatient = useSession((s) => s.selectPatient);
  const patients = useHospital((s) => s.data.patients);
  const router = useRouter();
  const [q, setQ] = useState("");

  useEffect(() => { if (!open) setQ(""); }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    const pats = patients
      .filter((p) =>
        !term ||
        fullName(p).toLowerCase().includes(term) ||
        p.documentNumber.includes(term) ||
        p.recordNumber.toLowerCase().includes(term) ||
        p.eps.toLowerCase().includes(term),
      )
      .slice(0, 6);
    const navs = ALL_NAV_ITEMS.filter((n) => !term || n.label.toLowerCase().includes(term)).slice(0, 6);
    return { pats, navs };
  }, [q, patients]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
      <div className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label="Búsqueda global" data-testid="command-palette" className="relative z-10 w-full max-w-xl animate-scale-in overflow-hidden rounded-xl border border-ink-200 bg-white shadow-2xl">
        <div className="flex items-center gap-2 border-b border-ink-200 px-4">
          <Search className="h-4 w-4 text-ink-400" />
          <input
            autoFocus
            data-testid="patient-search-input"
            aria-label="Buscar"
            placeholder="Buscar paciente por nombre, documento, HC, EPS o módulo…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-400"
          />
        </div>
        <div className="max-h-[55vh] overflow-y-auto p-2">
          {results.pats.length > 0 && (
            <div className="mb-1">
              <p className="px-2 py-1 text-2xs font-semibold uppercase tracking-wide text-ink-400">Pacientes</p>
              {results.pats.map((p) => (
                <button
                  key={p.id}
                  data-testid={`command-patient-${p.id}`}
                  onClick={() => { selectPatient(p.id); router.push(`/patients/${p.id}`); setOpen(false); }}
                  className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm hover:bg-clinical-50"
                >
                  <UserRound className="h-4 w-4 text-clinical-500" />
                  <span className="flex-1">
                    <span className="font-medium text-ink-800">{fullName(p)}</span>
                    <span className="ml-2 text-2xs text-ink-400">{ageFromBirthDate(p.birthDate)}a · {p.documentType} {p.documentNumber} · {p.eps}</span>
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-ink-300" />
                </button>
              ))}
            </div>
          )}
          <div>
            <p className="px-2 py-1 text-2xs font-semibold uppercase tracking-wide text-ink-400">Módulos</p>
            {results.navs.map((n) => {
              const Icon = n.icon;
              return (
                <button
                  key={n.key}
                  data-testid={`command-nav-${n.key}`}
                  onClick={() => { router.push(n.href); setOpen(false); }}
                  className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm hover:bg-ink-50"
                >
                  <Icon className="h-4 w-4 text-ink-400" />
                  <span className="flex-1 text-ink-700">{n.label}</span>
                  <LayoutGrid className="h-3.5 w-3.5 text-ink-300" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
