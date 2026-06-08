"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Home } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Section, Stat } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EpicrisisForm } from "@/components/clinical/EpicrisisForm";
import { SelectedPatientBanner } from "@/components/clinical/SelectedPatientBanner";
import { useSelected } from "@/lib/hooks/useSelected";
import { useHospital } from "@/lib/store/useHospital";
import { useSession } from "@/lib/store/useSession";
import { fullName } from "@/lib/utils/format";

export default function DischargePage() {
  const { patient, encounter } = useSelected();
  const data = useHospital((s) => s.data);
  const selectPatient = useSession((s) => s.selectPatient);
  const selectEncounter = useSession((s) => s.selectEncounter);
  const router = useRouter();

  const admitted = useMemo(() => data.encounters.filter((e) => (e.type === "inpatient" || e.type === "icu") && e.status === "admitted"), [data.encounters]);
  const name = (id: string) => { const p = data.patients.find((x) => x.id === id); return p ? fullName(p) : id; };
  const dischargeable = encounter && (encounter.type === "inpatient" || encounter.type === "icu");

  return (
    <PageContainer>
      <PageHeader title="Egresos / Epicrisis" description="Pacientes pendientes de egreso y elaboración de epicrisis." icon={<Home className="h-5 w-5" />} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Pendientes de egreso" value={admitted.length} tone="amber" />
        <Stat label="Epicrisis firmadas" value={data.notes.filter((n) => n.type === "epicrisis").length} tone="green" />
        <Stat label="Egresados (demo)" value={data.encounters.filter((e) => e.status === "discharged").length} tone="blue" />
        <Stat label="UCI" value={admitted.filter((e) => e.type === "icu").length} tone="red" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Section title="Pacientes hospitalizados" testId="section-discharge-worklist">
          <div className="space-y-1.5">
            {admitted.slice(0, 30).map((e) => (
              <button key={e.id} onClick={() => { selectPatient(e.patientId); selectEncounter(e.id); }} data-testid={`discharge-pick-${e.id}`} className={`flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm ${encounter?.id === e.id ? "border-clinical-400 bg-clinical-50" : "border-ink-200 hover:bg-ink-50"}`}>
                <span><Badge tone="teal">{e.bed}</Badge> <span className="ml-1 font-medium text-ink-800">{name(e.patientId)}</span></span>
                <span className="text-2xs text-ink-400">{e.ward}</span>
              </button>
            ))}
          </div>
        </Section>

        <div className="lg:col-span-2">
          <SelectedPatientBanner requirement="elaborar la epicrisis" />
          <div className="mt-4">
            {patient && dischargeable && encounter ? (
              <EpicrisisForm encounter={encounter} patient={patient} />
            ) : (
              <p className="text-sm text-ink-400">Seleccione un paciente hospitalizado de la lista para elaborar su epicrisis. <Button size="sm" variant="ghost" onClick={() => router.push("/inpatient")}>Ir a hospitalización</Button></p>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
