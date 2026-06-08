"use client";

import { useRouter } from "next/navigation";
import { Scissors, CalendarDays } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Stat } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useHospital } from "@/lib/store/useHospital";
import { useUI } from "@/lib/store/useUI";
import { fullName, formatDateTime } from "@/lib/utils/format";
import { surgeryStatusMeta } from "@/lib/utils/status";
import type { SurgeryCase, SurgeryStatus } from "@/lib/types";

const NEXT: Record<string, SurgeryStatus> = { scheduled: "pre-op", "pre-op": "in-progress", "in-progress": "recovery", recovery: "completed" };

export default function SurgeryPage() {
  const data = useHospital((s) => s.data);
  const setSurgeryStatus = useHospital((s) => s.setSurgeryStatus);
  const addToast = useUI((s) => s.addToast);
  const router = useRouter();
  const name = (id: string) => { const p = data.patients.find((x) => x.id === id); return p ? fullName(p) : id; };

  const cols: Column<SurgeryCase>[] = [
    { key: "procedure", header: "Procedimiento", render: (s) => <div><div className="font-medium text-ink-900">{s.procedure}</div><div className="text-2xs text-ink-400">{name(s.patientId)} · {s.room}</div></div> },
    { key: "surgeon", header: "Cirujano", render: (s) => s.surgeon },
    { key: "time", header: "Programada", render: (s) => <span className="text-2xs text-ink-400">{formatDateTime(s.scheduledAt)}</span> },
    { key: "anesthesia", header: "Anestesia", render: (s) => <Badge tone="slate">{s.anesthesia}</Badge> },
    { key: "checks", header: "Verificación", render: (s) => <div className="flex gap-1">{s.consentSigned ? <Badge tone="green">Consent.</Badge> : <Badge tone="amber">Sin consent.</Badge>}{s.safetyChecklistDone ? <Badge tone="green">Checklist</Badge> : <Badge tone="amber">Pend.</Badge>}</div> },
    { key: "status", header: "Estado", render: (s) => <Badge tone={surgeryStatusMeta(s.status).tone}>{surgeryStatusMeta(s.status).label}</Badge> },
    { key: "actions", header: "", align: "right", render: (s) => (
      <div className="flex justify-end gap-1.5">
        {NEXT[s.status] && <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSurgeryStatus(s.id, NEXT[s.status]); addToast({ title: `Estado: ${surgeryStatusMeta(NEXT[s.status]).label}`, variant: "success" }); }} data-testid={`surgery-advance-${s.id}`}>Avanzar</Button>}
        <Button size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/surgery/case/${s.id}`); }} data-testid={`surgery-open-${s.id}`}>Caso</Button>
      </div>
    ) },
  ];

  return (
    <PageContainer>
      <PageHeader title="Cirugía / Quirófanos" description="Programación quirúrgica, verificación y notas operatorias." icon={<Scissors className="h-5 w-5" />} actions={<Button variant="outline" onClick={() => router.push("/surgery/schedule")}><CalendarDays className="h-4 w-4" /> Agenda</Button>} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Programadas" value={data.surgeries.filter((s) => s.status === "scheduled").length} tone="blue" />
        <Stat label="En cirugía" value={data.surgeries.filter((s) => s.status === "in-progress").length} tone="amber" />
        <Stat label="Recuperación" value={data.surgeries.filter((s) => s.status === "recovery").length} tone="purple" />
        <Stat label="Completadas" value={data.surgeries.filter((s) => s.status === "completed").length} tone="green" />
      </div>

      <DataTable columns={cols} rows={data.surgeries} getRowId={(s) => s.id} testId="surgery-board" rowTestId={(s) => `surgery-row-${s.id}`} onRowClick={(s) => router.push(`/surgery/case/${s.id}`)} />
    </PageContainer>
  );
}
