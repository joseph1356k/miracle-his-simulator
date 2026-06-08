"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Search, UserPlus, AlertTriangle } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Card } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useHospital } from "@/lib/store/useHospital";
import { useSession } from "@/lib/store/useSession";
import { EPS_LIST } from "@/lib/data/catalogs";
import { ageFromBirthDate, fullName } from "@/lib/utils/format";
import type { Patient } from "@/lib/types";

export default function PatientsPage() {
  const patients = useHospital((s) => s.data.patients);
  const encounters = useHospital((s) => s.data.encounters);
  const selectPatient = useSession((s) => s.selectPatient);
  const router = useRouter();
  const [q, setQ] = useState("");
  const [eps, setEps] = useState("");
  const [sex, setSex] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);

  const activeIds = useMemo(
    () => new Set(encounters.filter((e) => ["admitted", "in-progress", "observation", "waiting"].includes(e.status)).map((e) => e.patientId)),
    [encounters],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return patients.filter((p) => {
      if (eps && p.eps !== eps) return false;
      if (sex && p.sex !== sex) return false;
      if (onlyActive && !activeIds.has(p.id)) return false;
      if (!term) return true;
      return (
        fullName(p).toLowerCase().includes(term) ||
        p.documentNumber.includes(term) ||
        p.recordNumber.toLowerCase().includes(term) ||
        p.phone.includes(term) ||
        p.eps.toLowerCase().includes(term)
      );
    });
  }, [patients, q, eps, sex, onlyActive, activeIds]);

  // Duplicate detection (same full name)
  const duplicates = useMemo(() => {
    const seen = new Map<string, number>();
    patients.forEach((p) => seen.set(fullName(p).toLowerCase(), (seen.get(fullName(p).toLowerCase()) ?? 0) + 1));
    return [...seen.entries()].filter(([, n]) => n > 1).map(([name]) => name);
  }, [patients]);

  const open = (p: Patient) => { selectPatient(p.id); router.push(`/patients/${p.id}`); };

  const columns: Column<Patient>[] = [
    { key: "name", header: "Paciente", render: (p) => (
      <div>
        <span className="font-medium text-ink-900">{fullName(p)}</span>
        <div className="text-2xs text-ink-400">{p.documentType} {p.documentNumber} · HC {p.recordNumber}</div>
      </div>
    ) },
    { key: "age", header: "Edad", render: (p) => `${ageFromBirthDate(p.birthDate)} a`, width: "70px" },
    { key: "sex", header: "Sexo", render: (p) => (p.sex === "M" ? "M" : p.sex === "F" ? "F" : "O"), width: "60px" },
    { key: "eps", header: "EPS", render: (p) => <span className="text-ink-600">{p.eps}</span> },
    { key: "city", header: "Ciudad", render: (p) => p.city },
    { key: "flags", header: "Banderas", render: (p) => (
      <div className="flex flex-wrap gap-1">
        {activeIds.has(p.id) && <Badge tone="teal">Activo</Badge>}
        {p.allergies.length > 0 && <Badge tone="red">Alergias</Badge>}
        {p.riskFlags.slice(0, 1).map((r) => <Badge key={r} tone="amber">{r}</Badge>)}
        {p.isolation !== "none" && <Badge tone="purple">Aislamiento</Badge>}
      </div>
    ) },
    { key: "actions", header: "", align: "right", render: (p) => <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); open(p); }} data-testid={`open-patient-${p.id}`}>Abrir</Button> },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Índice maestro de pacientes"
        description={`${patients.length} pacientes sintéticos registrados.`}
        icon={<Users className="h-5 w-5" />}
        actions={<Button onClick={() => router.push("/patients/new")} data-testid="patients-new"><UserPlus className="h-4 w-4" /> Registrar paciente</Button>}
      />

      {duplicates.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800" data-testid="duplicate-warning">
          <AlertTriangle className="h-4 w-4" />
          Posibles pacientes duplicados detectados ({duplicates.length}). Verifique identidad antes de crear nuevos registros.
        </div>
      )}

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-md border border-ink-200 bg-white px-2.5">
            <Search className="h-4 w-4 text-ink-400" />
            <input data-testid="patient-search-input" aria-label="Buscar paciente" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre, documento, HC, teléfono o EPS…" className="h-9 flex-1 bg-transparent text-sm outline-none" />
          </div>
          <select aria-label="EPS" data-testid="patients-filter-eps" value={eps} onChange={(e) => setEps(e.target.value)} className="h-9 rounded-md border border-ink-200 bg-white px-2 text-sm">
            <option value="">Todas las EPS</option>
            {EPS_LIST.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          <select aria-label="Sexo" data-testid="patients-filter-sex" value={sex} onChange={(e) => setSex(e.target.value)} className="h-9 rounded-md border border-ink-200 bg-white px-2 text-sm">
            <option value="">Sexo</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
          <label className="flex items-center gap-1.5 text-xs text-ink-600">
            <input type="checkbox" data-testid="patients-filter-active" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} className="h-4 w-4 rounded border-ink-300" />
            Solo con encuentro activo
          </label>
          <Badge tone="neutral">{filtered.length} resultados</Badge>
        </div>
      </Card>

      <DataTable columns={columns} rows={filtered} getRowId={(p) => p.id} onRowClick={open} rowTestId={(p) => `patient-row-${p.id}`} testId="patients-table" />
    </PageContainer>
  );
}
