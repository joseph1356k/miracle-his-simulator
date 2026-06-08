"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Section } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useHospital } from "@/lib/store/useHospital";
import { useSession } from "@/lib/store/useSession";
import { fullName, formatTime, formatDate } from "@/lib/utils/format";

export default function OutpatientSchedulePage() {
  const data = useHospital((s) => s.data);
  const selectPatient = useSession((s) => s.selectPatient);
  const selectEncounter = useSession((s) => s.selectEncounter);
  const router = useRouter();

  const byDay = useMemo(() => {
    const groups: Record<string, typeof data.encounters> = {};
    data.encounters.filter((e) => e.type === "outpatient").sort((a, b) => (a.startedAt < b.startedAt ? -1 : 1)).forEach((e) => {
      const key = formatDate(e.startedAt);
      (groups[key] ??= []).push(e);
    });
    return groups;
  }, [data.encounters]);

  const patient = (id: string) => data.patients.find((p) => p.id === id);

  return (
    <PageContainer>
      <PageHeader title="Agenda de consulta externa" description="Citas ambulatorias agrupadas por día." icon={<CalendarDays className="h-5 w-5" />} />
      <div className="space-y-4">
        {Object.entries(byDay).map(([day, items]) => (
          <Section key={day} title={day} testId={`schedule-day-${day}`} actions={<Badge tone="neutral">{items.length} citas</Badge>}>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((e) => { const p = patient(e.patientId); return (
                <button key={e.id} onClick={() => { selectPatient(e.patientId); selectEncounter(e.id); router.push(`/outpatient/consultation/${e.id}`); }} data-testid={`schedule-slot-${e.id}`} className="flex flex-col gap-1 rounded-md border border-ink-200 bg-white p-3 text-left hover:border-clinical-300 hover:shadow-sm">
                  <div className="flex items-center justify-between"><span className="text-sm font-semibold text-ink-900">{formatTime(e.startedAt)}</span><Badge tone="blue">{e.specialty}</Badge></div>
                  <span className="text-sm text-ink-700">{p ? fullName(p) : e.patientId}</span>
                  <span className="text-2xs text-ink-400">{e.reason}</span>
                </button>
              ); })}
            </div>
          </Section>
        ))}
      </div>
    </PageContainer>
  );
}
