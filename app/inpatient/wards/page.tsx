"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useHospital } from "@/lib/store/useHospital";
import { useSession } from "@/lib/store/useSession";
import { fullName } from "@/lib/utils/format";
import { WARDS } from "@/lib/data/catalogs";

export default function WardsPage() {
  const data = useHospital((s) => s.data);
  const selectPatient = useSession((s) => s.selectPatient);
  const selectEncounter = useSession((s) => s.selectEncounter);
  const router = useRouter();

  const byWard = useMemo(() => {
    const map: Record<string, typeof data.encounters> = {};
    data.encounters.filter((e) => e.type === "inpatient" || e.type === "icu").forEach((e) => { (map[e.ward ?? "Sin servicio"] ??= []).push(e); });
    return map;
  }, [data.encounters]);
  const patient = (id: string) => data.patients.find((p) => p.id === id);

  return (
    <PageContainer>
      <PageHeader title="Servicios de hospitalización" description="Pacientes agrupados por servicio / piso." icon={<Building2 className="h-5 w-5" />} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {WARDS.map((w) => {
          const list = byWard[w] ?? [];
          return (
            <Card key={w}>
              <CardHeader title={w} actions={<Badge tone="teal">{list.length} ocupadas</Badge>} />
              <CardBody className="space-y-1.5">
                {list.length === 0 ? <p className="text-sm text-ink-400">Sin pacientes.</p> : list.map((e) => { const p = patient(e.patientId); return (
                  <button key={e.id} onClick={() => { selectPatient(e.patientId); selectEncounter(e.id); router.push(`/inpatient/encounter/${e.id}`); }} className="flex w-full items-center justify-between gap-2 rounded-md border border-ink-200 px-3 py-1.5 text-left text-sm hover:bg-ink-50">
                    <span><Badge tone="slate">{e.bed}</Badge> <span className="ml-1 text-ink-800">{p ? fullName(p) : e.patientId}</span></span>
                    <span className="text-2xs text-ink-400">{e.admissionDiagnosis ?? e.reason}</span>
                  </button>
                ); })}
              </CardBody>
            </Card>
          );
        })}
      </div>
    </PageContainer>
  );
}
