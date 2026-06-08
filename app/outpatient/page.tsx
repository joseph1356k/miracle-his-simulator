"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Stethoscope, CalendarDays } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Card, Stat } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useHospital } from "@/lib/store/useHospital";
import { useSession } from "@/lib/store/useSession";
import { ageFromBirthDate, fullName, formatDateTime } from "@/lib/utils/format";
import { encounterStatusMeta } from "@/lib/utils/status";
import { SPECIALTIES } from "@/lib/data/catalogs";
import type { Encounter } from "@/lib/types";

export default function OutpatientPage() {
  const data = useHospital((s) => s.data);
  const selectPatient = useSession((s) => s.selectPatient);
  const selectEncounter = useSession((s) => s.selectEncounter);
  const router = useRouter();
  const [specialty, setSpecialty] = useState("");

  const rows = useMemo(() => data.encounters.filter((e) => e.type === "outpatient").filter((e) => specialty ? e.specialty === specialty : true), [data.encounters, specialty]);
  const patient = (id: string) => data.patients.find((p) => p.id === id);

  const open = (e: Encounter) => { selectPatient(e.patientId); selectEncounter(e.id); router.push(`/outpatient/consultation/${e.id}`); };

  const cols: Column<Encounter>[] = [
    { key: "patient", header: "Paciente", render: (e) => { const p = patient(e.patientId); return p ? <div><div className="font-medium text-ink-900">{fullName(p)}</div><div className="text-2xs text-ink-400">{ageFromBirthDate(p.birthDate)}a · {p.eps}</div></div> : e.patientId; } },
    { key: "specialty", header: "Especialidad", render: (e) => <Badge tone="blue">{e.specialty}</Badge> },
    { key: "reason", header: "Motivo", render: (e) => e.reason },
    { key: "time", header: "Cita", render: (e) => <span className="text-2xs text-ink-400">{formatDateTime(e.startedAt)}</span> },
    { key: "status", header: "Estado", render: (e) => <Badge tone={encounterStatusMeta(e.status).tone}>{encounterStatusMeta(e.status).label}</Badge> },
    { key: "open", header: "", align: "right", render: (e) => <Button size="sm" variant="outline" onClick={() => open(e)} data-testid={`outpatient-open-${e.id}`}>Atender</Button> },
  ];

  return (
    <PageContainer>
      <PageHeader title="Consulta externa" description="Sala de espera y agenda de citas ambulatorias por especialidad." icon={<Stethoscope className="h-5 w-5" />} actions={<Button variant="outline" onClick={() => router.push("/outpatient/schedule")}><CalendarDays className="h-4 w-4" /> Agenda</Button>} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="En sala de espera" value={rows.filter((e) => e.status === "scheduled").length} tone="amber" />
        <Stat label="En atención" value={rows.filter((e) => e.status === "in-progress").length} tone="blue" />
        <Stat label="Especialidades" value={new Set(data.encounters.filter((e) => e.type === "outpatient").map((e) => e.specialty)).size} />
        <Stat label="Total citas" value={data.encounters.filter((e) => e.type === "outpatient").length} tone="green" />
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-2xs font-semibold uppercase text-ink-400">Especialidad</span>
          <select aria-label="Filtrar por especialidad" data-testid="outpatient-filter-specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="h-9 rounded-md border border-ink-200 px-2 text-sm">
            <option value="">Todas</option>
            {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </Card>

      <DataTable columns={cols} rows={rows} getRowId={(e) => e.id} testId="outpatient-board" rowTestId={(e) => `outpatient-row-${e.id}`} onRowClick={open} />
    </PageContainer>
  );
}
