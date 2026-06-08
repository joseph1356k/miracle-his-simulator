"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { Home } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { EpicrisisForm } from "@/components/clinical/EpicrisisForm";
import { useHospital } from "@/lib/store/useHospital";
import { useSession } from "@/lib/store/useSession";
import { ageFromBirthDate, fullName } from "@/lib/utils/format";

export default function DischargeEncounterPage() {
  const params = useParams<{ id: string }>();
  const data = useHospital((s) => s.data);
  const selectPatient = useSession((s) => s.selectPatient);
  const selectEncounter = useSession((s) => s.selectEncounter);

  const encounter = data.encounters.find((e) => e.id === params.id);
  const patient = data.patients.find((p) => p.id === encounter?.patientId);
  useEffect(() => { if (encounter) { selectPatient(encounter.patientId); selectEncounter(encounter.id); } }, [encounter, selectPatient, selectEncounter]);

  if (!encounter || !patient) return <PageContainer><p className="text-sm text-ink-500">Encuentro no encontrado.</p></PageContainer>;

  return (
    <PageContainer>
      <PageHeader title="Epicrisis de egreso" description={`${fullName(patient)} · ${ageFromBirthDate(patient.birthDate)} años · ${encounter.ward ?? encounter.type}`} icon={<Home className="h-5 w-5" />} badge={<Badge tone="teal">{encounter.id}</Badge>} />
      <EpicrisisForm encounter={encounter} patient={patient} />
    </PageContainer>
  );
}
