"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Section, Stat } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useHospital } from "@/lib/store/useHospital";
import { useSession } from "@/lib/store/useSession";
import { fullName } from "@/lib/utils/format";
import { WARDS } from "@/lib/data/catalogs";

export default function BedBoardPage() {
  const data = useHospital((s) => s.data);
  const selectPatient = useSession((s) => s.selectPatient);
  const selectEncounter = useSession((s) => s.selectEncounter);
  const router = useRouter();

  const wards = useMemo(() => WARDS.map((w) => {
    const occupied = data.encounters.filter((e) => (e.type === "inpatient" || e.type === "icu") && e.ward === w);
    const capacity = Math.max(occupied.length + 4, 12);
    return { ward: w, occupied, free: capacity - occupied.length, capacity };
  }), [data.encounters]);

  const patient = (id: string) => data.patients.find((p) => p.id === id);
  const totalOccupied = wards.reduce((a, w) => a + w.occupied.length, 0);
  const totalCapacity = wards.reduce((a, w) => a + w.capacity, 0);

  return (
    <PageContainer>
      <PageHeader title="Mapa de camas" description="Ocupación de camas por servicio (verde = libre, azul = ocupada)." icon={<LayoutGrid className="h-5 w-5" />} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Camas ocupadas" value={totalOccupied} tone="blue" />
        <Stat label="Camas libres" value={totalCapacity - totalOccupied} tone="green" />
        <Stat label="Capacidad" value={totalCapacity} />
        <Stat label="Ocupación" value={`${Math.round((totalOccupied / totalCapacity) * 100)}%`} tone="amber" />
      </div>

      <div className="space-y-4">
        {wards.map((w) => (
          <Section key={w.ward} title={w.ward} testId={`bedboard-${w.ward}`} actions={<Badge tone="neutral">{w.occupied.length}/{w.capacity}</Badge>}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {w.occupied.map((e) => { const p = patient(e.patientId); return (
                <button key={e.id} onClick={() => { selectPatient(e.patientId); selectEncounter(e.id); router.push(`/inpatient/encounter/${e.id}`); }} data-testid={`bed-${e.bed}`} className="flex flex-col gap-0.5 rounded-md border border-clinical-200 bg-clinical-50 p-2 text-left hover:border-clinical-400">
                  <span className="text-2xs font-semibold text-clinical-700">{e.bed}</span>
                  <span className="truncate text-xs font-medium text-ink-800">{p ? fullName(p) : ""}</span>
                  <span className="truncate text-2xs text-ink-400">{e.admissionDiagnosis ?? e.reason}</span>
                </button>
              ); })}
              {Array.from({ length: w.free }).map((_, i) => (
                <div key={i} className="flex items-center justify-center rounded-md border border-dashed border-emerald-200 bg-emerald-50/40 p-2 text-2xs text-emerald-600">Libre</div>
              ))}
            </div>
          </Section>
        ))}
      </div>
    </PageContainer>
  );
}
