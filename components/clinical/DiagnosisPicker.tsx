"use client";

import { useMemo, useState } from "react";
import { Plus, X, Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { CIE10_CATALOG, CATALOG_DISCLAIMER } from "@/lib/data/catalogs";
import { useHospital } from "@/lib/store/useHospital";
import { useSession } from "@/lib/store/useSession";
import { useFieldRegistry } from "@/lib/store/useFieldRegistry";
import { usePathname } from "next/navigation";
import { genId } from "@/lib/utils/id";
import { nowIso } from "@/lib/utils/format";
import { useEffect } from "react";
import type { Diagnosis, DiagnosisKind } from "@/lib/types";

/** Searchable CIE-10 picker that writes Diagnosis records onto an encounter. */
export function DiagnosisPicker({
  encounterId,
  patientId,
  testId = "field-diagnosis",
  section = "Diagnósticos",
  kind = "principal",
}: {
  encounterId: string;
  patientId: string;
  testId?: string;
  section?: string;
  kind?: DiagnosisKind;
}) {
  const [q, setQ] = useState("");
  const data = useHospital((s) => s.data);
  const addDiagnosis = useHospital((s) => s.addDiagnosis);
  const removeDiagnosis = useHospital((s) => s.removeDiagnosis);
  const { userName } = useSession();
  const pathname = usePathname();
  const register = useFieldRegistry((s) => s.register);
  const unregister = useFieldRegistry((s) => s.unregister);
  const updateValue = useFieldRegistry((s) => s.updateValue);

  const current = useMemo(() => data.diagnoses.filter((d) => d.encounterId === encounterId), [data.diagnoses, encounterId]);

  useEffect(() => {
    register({ testId, domId: testId, label: "Diagnóstico (CIE-10)", section, route: pathname, type: "search", required: false, value: current.map((d) => d.code).join(", ") });
    return () => unregister(testId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId, pathname]);
  useEffect(() => { updateValue(testId, current.map((d) => d.code).join(", ")); }, [current, testId, updateValue]);

  const matches = useMemo(() => {
    if (!q.trim()) return [];
    const t = q.toLowerCase();
    return CIE10_CATALOG.filter((c) => c.code.toLowerCase().includes(t) || c.label.toLowerCase().includes(t)).slice(0, 8);
  }, [q]);

  const add = (code: string, label: string) => {
    const d: Diagnosis = { id: genId("dx"), encounterId, patientId, code, label, kind, status: "presuntivo", recordedAt: nowIso(), recordedBy: userName };
    addDiagnosis(d);
    setQ("");
  };

  return (
    <div data-field-testid={testId}>
      <label htmlFor={testId} className="field-label">Diagnóstico (CIE-10)</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-ink-400" />
        <input
          id={testId}
          name="diagnosis"
          data-testid={testId}
          aria-label="Buscar diagnóstico CIE-10"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por código o descripción (ej: I10, dolor torácico)…"
          className="field-input pl-8"
          autoComplete="off"
        />
        {matches.length > 0 && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-ink-200 bg-white shadow-lg" role="listbox">
            {matches.map((c) => (
              <button key={c.code} type="button" onClick={() => add(c.code, c.label)} data-testid={`diagnosis-option-${c.code}`} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-clinical-50">
                <Badge tone="blue">{c.code}</Badge>
                <span className="text-ink-700">{c.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="field-help">{CATALOG_DISCLAIMER}</p>

      {current.length > 0 && (
        <ul className="mt-2 space-y-1.5" data-testid="diagnosis-list">
          {current.map((d) => (
            <li key={d.id} className="flex items-center gap-2 rounded-md border border-ink-200 bg-white px-2.5 py-1.5 text-sm">
              <Badge tone="blue">{d.code}</Badge>
              <span className="flex-1 text-ink-700">{d.label}</span>
              <Badge tone="slate">{d.kind}</Badge>
              <button type="button" onClick={() => removeDiagnosis(d.id)} aria-label={`Quitar ${d.code}`} data-testid={`diagnosis-remove-${d.id}`} className="rounded p-1 text-ink-400 hover:bg-rose-50 hover:text-rose-600"><X className="h-3.5 w-3.5" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
