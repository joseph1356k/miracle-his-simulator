"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BedDouble, LayoutGrid, Building2 } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Card, Stat } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useHospital } from "@/lib/store/useHospital";
import { useSession } from "@/lib/store/useSession";
import { ageFromBirthDate, fullName, relativeFromNow } from "@/lib/utils/format";
import { WARDS } from "@/lib/data/catalogs";
import type { Encounter } from "@/lib/types";

export default function InpatientPage() {
  const data = useHospital((s) => s.data);
  const selectPatient = useSession((s) => s.selectPatient);
  const selectEncounter = useSession((s) => s.selectEncounter);
  const router = useRouter();
  const [ward, setWard] = useState("");

  const rows = useMemo(() => data.encounters.filter((e) => e.type === "inpatient").filter((e) => ward ? e.ward === ward : true), [data.encounters, ward]);
  const patient = (id: string) => data.patients.find((p) => p.id === id);
  const open = (e: Encounter) => { selectPatient(e.patientId); selectEncounter(e.id); router.push(`/inpatient/encounter/${e.id}`); };

  const cols: Column<Encounter>[] = [
    { key: "bed", header: "Cama", render: (e) => <Badge tone="teal">{e.bed}</Badge> },
    { key: "patient", header: "Paciente", render: (e) => { const p = patient(e.patientId); return p ? <div><div className="font-medium text-ink-900">{fullName(p)}</div><div className="text-2xs text-ink-400">{ageFromBirthDate(p.birthDate)}a · {p.documentType} {p.documentNumber}</div></div> : e.patientId; } },
    { key: "dx", header: "Dx de ingreso", render: (e) => <span className="text-sm">{e.admissionDiagnosis ?? e.reason}</span> },
    { key: "ward", header: "Servicio", render: (e) => <span className="text-2xs text-ink-500">{e.ward}</span> },
    { key: "doc", header: "Médico", render: (e) => <span className="text-2xs text-ink-500">{e.attendingPhysician}</span> },
    { key: "los", header: "Estancia", render: (e) => <span className="text-2xs text-ink-400">{relativeFromNow(e.startedAt).replace("hace ", "")}</span> },
    { key: "open", header: "", align: "right", render: (e) => <Button size="sm" variant="outline" onClick={() => open(e)} data-testid={`inpatient-open-${e.id}`}>Abrir</Button> },
  ];

  return (
    <PageContainer>
      <PageHeader title="Hospitalización" description="Censo de pacientes hospitalizados por servicio." icon={<BedDouble className="h-5 w-5" />}
        actions={<><Button variant="outline" onClick={() => router.push("/inpatient/wards")}><Building2 className="h-4 w-4" /> Servicios</Button><Button variant="outline" onClick={() => router.push("/inpatient/bed-board")}><LayoutGrid className="h-4 w-4" /> Mapa de camas</Button></>} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Hospitalizados" value={rows.length} tone="teal" />
        <Stat label="Servicios" value={new Set(data.encounters.filter((e) => e.type === "inpatient").map((e) => e.ward)).size} />
        <Stat label="Aislamiento" value={rows.filter((e) => patient(e.patientId)?.isolation !== "none").length} tone="purple" />
        <Stat label="Alto riesgo" value={rows.filter((e) => (patient(e.patientId)?.riskFlags.length ?? 0) > 0).length} tone="amber" />
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-2xs font-semibold uppercase text-ink-400">Servicio</span>
          <select aria-label="Filtrar por servicio" data-testid="inpatient-filter-ward" value={ward} onChange={(e) => setWard(e.target.value)} className="h-9 rounded-md border border-ink-200 px-2 text-sm">
            <option value="">Todos</option>
            {WARDS.filter((w) => !w.includes("UCI")).map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
      </Card>

      <DataTable columns={cols} rows={rows} getRowId={(e) => e.id} testId="inpatient-census" rowTestId={(e) => `inpatient-row-${e.id}`} onRowClick={open} />
    </PageContainer>
  );
}
