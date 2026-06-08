"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Copy, Download, FlaskConical, X } from "lucide-react";
import { useUI } from "@/lib/store/useUI";
import { useSession } from "@/lib/store/useSession";
import { useHospital } from "@/lib/store/useHospital";
import { useFieldRegistry } from "@/lib/store/useFieldRegistry";
import { formatDateTime } from "@/lib/utils/format";

function Meta({ label, value, testId }: { label: string; value: React.ReactNode; testId?: string }) {
  return (
    <div className="flex justify-between gap-2 py-0.5 text-2xs">
      <span className="text-ink-400">{label}</span>
      <span className="text-right font-medium text-ink-200" data-testid={testId}>{value}</span>
    </div>
  );
}

export function MiracleOverlay() {
  const open = useUI((s) => s.miracleOverlayOpen);
  const setOpen = useUI((s) => s.setMiracleOverlay);
  const lastEditedField = useUI((s) => s.lastEditedField);
  const unsaved = useUI((s) => s.unsavedChanges);
  const activeModal = useUI((s) => s.activeModal);
  const drawerOpen = useUI((s) => s.patientDrawerOpen);
  const pathname = usePathname();
  const { selectedPatientId, selectedEncounterId, roleId } = useSession();
  const lastAudit = useHospital((s) => s.data.audit[0]);
  const fieldsMap = useFieldRegistry((s) => s.fields);
  const [filter, setFilter] = useState("");

  const fields = useMemo(
    () => Object.values(fieldsMap).filter((f) => f.route === pathname),
    [fieldsMap, pathname],
  );
  const filtered = useMemo(
    () => fields.filter((f) => !filter || f.section.toLowerCase().includes(filter.toLowerCase()) || f.label.toLowerCase().includes(filter.toLowerCase()) || f.testId.includes(filter)),
    [fields, filter],
  );
  const requiredCount = fields.filter((f) => f.required).length;
  const filledCount = fields.filter((f) => f.value && f.value.trim() !== "" && f.value !== "false").length;

  if (!open) return null;

  const copy = (text: string) => navigator.clipboard?.writeText(text);
  const exportMap = () => {
    const payload = { route: pathname, capturedAt: new Date().toISOString(), patientId: selectedPatientId, encounterId: selectedEncounterId, fields };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `miracle-fieldmap-${pathname.replace(/\W+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <aside
      data-testid="miracle-overlay"
      className="fixed bottom-4 right-4 z-40 flex max-h-[80vh] w-[360px] flex-col overflow-hidden rounded-xl border border-violet-300/40 bg-ink-900 text-ink-100 shadow-2xl"
    >
      <div className="flex items-center justify-between border-b border-white/10 bg-violet-600/20 px-3 py-2">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-violet-300" />
          <span className="text-sm font-semibold text-white">Miracle QA Overlay</span>
        </div>
        <button onClick={() => setOpen(false)} aria-label="Cerrar overlay" data-testid="miracle-overlay-close" className="rounded p-1 text-ink-300 hover:bg-white/10">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="border-b border-white/10 px-3 py-2">
        <Meta label="Ruta actual" value={pathname} testId="miracle-meta-route" />
        <Meta label="Rol activo" value={roleId} />
        <Meta label="Paciente" value={selectedPatientId ?? "—"} testId="miracle-meta-patient" />
        <Meta label="Encuentro" value={selectedEncounterId ?? "—"} testId="miracle-meta-encounter" />
        <Meta label="Campos visibles" value={fields.length} testId="miracle-meta-field-count" />
        <Meta label="Campos requeridos" value={requiredCount} />
        <Meta label="Campos diligenciados" value={`${filledCount}/${fields.length}`} />
        <Meta label="Último campo editado" value={lastEditedField ?? "—"} testId="miracle-meta-last-field" />
        <Meta label="Cambios sin guardar" value={unsaved ? "Sí" : "No"} />
        <Meta label="Modal activo" value={activeModal ?? (drawerOpen ? "drawer-patient-summary" : "—")} />
        <Meta label="Último evento auditoría" value={lastAudit ? `${lastAudit.action} · ${lastAudit.entity}` : "—"} />
        {lastAudit && <Meta label="Hora evento" value={formatDateTime(lastAudit.timestamp)} />}
      </div>

      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrar por sección, label o testid…"
          data-testid="miracle-field-filter"
          className="h-7 flex-1 rounded-md border border-white/10 bg-white/5 px-2 text-2xs text-white outline-none placeholder:text-ink-500"
        />
        <button onClick={exportMap} data-testid="miracle-export-map" className="flex items-center gap-1 rounded-md bg-violet-600 px-2 py-1 text-2xs font-medium text-white hover:bg-violet-500">
          <Download className="h-3 w-3" /> JSON
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2" data-testid="miracle-field-list">
        {filtered.length === 0 && <p className="px-2 py-6 text-center text-2xs text-ink-500">No hay campos registrados en esta pantalla.</p>}
        {filtered.map((f) => (
          <div key={f.testId} className="mb-1 rounded-md border border-white/5 bg-white/5 px-2 py-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-2xs font-medium text-white">{f.label}</span>
              <button onClick={() => copy(f.testId)} aria-label={`Copiar testid ${f.testId}`} className="shrink-0 rounded p-0.5 text-ink-400 hover:bg-white/10 hover:text-white">
                <Copy className="h-3 w-3" />
              </button>
            </div>
            <div className="flex items-center justify-between gap-2 text-[10px] text-ink-400">
              <code className="truncate">{f.testId}</code>
              <span className="shrink-0">{f.section}{f.required ? " · req" : ""}</span>
            </div>
            <div className="truncate text-[10px] text-emerald-300">{f.value || "—"}</div>
          </div>
        ))}
      </div>
    </aside>
  );
}
