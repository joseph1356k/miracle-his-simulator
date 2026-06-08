"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Ambulance, Stethoscope, ClipboardList } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Card, Stat } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useHospital } from "@/lib/store/useHospital";
import { useSession } from "@/lib/store/useSession";
import { ageFromBirthDate, fullName, minutesToHuman, relativeFromNow } from "@/lib/utils/format";
import { encounterStatusMeta, triageLevelMeta } from "@/lib/utils/status";
import type { Encounter } from "@/lib/types";

export default function EmergencyPage() {
  const data = useHospital((s) => s.data);
  const selectPatient = useSession((s) => s.selectPatient);
  const selectEncounter = useSession((s) => s.selectEncounter);
  const router = useRouter();
  const [level, setLevel] = useState<string>("");

  const rows = useMemo(() => {
    return data.encounters
      .filter((e) => e.type === "emergency")
      .filter((e) => (level ? String(e.triage?.level) === level : true))
      .sort((a, b) => (a.triage?.level ?? 9) - (b.triage?.level ?? 9));
  }, [data.encounters, level]);

  const patient = (id: string) => data.patients.find((p) => p.id === id);
  const counts = useMemo(() => ({
    waiting: data.encounters.filter((e) => e.type === "emergency" && e.status === "waiting").length,
    l1l2: data.encounters.filter((e) => e.type === "emergency" && (e.triage?.level ?? 9) <= 2).length,
    observation: data.encounters.filter((e) => e.type === "emergency" && e.status === "observation").length,
    total: data.encounters.filter((e) => e.type === "emergency").length,
  }), [data.encounters]);

  const open = (e: Encounter) => { selectPatient(e.patientId); selectEncounter(e.id); router.push(`/emergency/encounter/${e.id}`); };

  const columns: Column<Encounter>[] = [
    { key: "triage", header: "Triage", width: "150px", render: (e) => <Badge tone={triageLevelMeta(e.triage?.level).tone}>{e.triage?.level ? `Nivel ${e.triage.level}` : "Sin triage"}</Badge> },
    { key: "patient", header: "Paciente", render: (e) => { const p = patient(e.patientId); return p ? <div><div className="font-medium text-ink-900">{fullName(p)}</div><div className="text-2xs text-ink-400">{ageFromBirthDate(p.birthDate)}a · {p.documentType} {p.documentNumber}</div></div> : e.patientId; } },
    { key: "reason", header: "Motivo", render: (e) => e.reason },
    { key: "box", header: "Box", render: (e) => e.triage?.assignedBox ?? "—" },
    { key: "wait", header: "Espera", render: (e) => <span className="text-2xs">{minutesToHuman(e.triage?.waitMinutes ?? 0)}</span> },
    { key: "status", header: "Estado", render: (e) => <Badge tone={encounterStatusMeta(e.status).tone}>{encounterStatusMeta(e.status).label}</Badge> },
    { key: "arrival", header: "Ingreso", render: (e) => <span className="text-2xs text-ink-400">{relativeFromNow(e.startedAt)}</span> },
    { key: "open", header: "", align: "right", render: (e) => <Button size="sm" variant="outline" onClick={() => open(e)} data-testid={`emergency-open-${e.id}`}>Atender</Button> },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Urgencias"
        description="Tablero de la sala de urgencias ordenado por prioridad de triage."
        icon={<Ambulance className="h-5 w-5" />}
        actions={<Button variant="outline" onClick={() => router.push("/emergency/triage")} data-testid="emergency-triage-btn"><ClipboardList className="h-4 w-4" /> Triage de enfermería</Button>}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="En espera" value={counts.waiting} tone="amber" onClick={() => setLevel("")} />
        <Stat label="Triage 1-2 (crítico)" value={counts.l1l2} tone="red" />
        <Stat label="En observación" value={counts.observation} tone="purple" />
        <Stat label="Total en urgencias" value={counts.total} tone="blue" />
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-2xs font-semibold uppercase text-ink-400">Filtrar por triage</span>
          <div className="flex gap-1">
            <Button size="sm" variant={level === "" ? "primary" : "outline"} onClick={() => setLevel("")}>Todos</Button>
            {[1, 2, 3, 4, 5].map((l) => (
              <Button key={l} size="sm" variant={level === String(l) ? "primary" : "outline"} onClick={() => setLevel(String(l))} data-testid={`emergency-filter-triage-${l}`}>Nivel {l}</Button>
            ))}
          </div>
        </div>
      </Card>

      <DataTable columns={columns} rows={rows} getRowId={(e) => e.id} rowTestId={(e) => `emergency-row-${e.id}`} testId="emergency-board" onRowClick={open} />
    </PageContainer>
  );
}
