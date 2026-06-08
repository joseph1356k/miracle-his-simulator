"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Section } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useHospital } from "@/lib/store/useHospital";
import { fullName, formatDateTime } from "@/lib/utils/format";
import { surgeryStatusMeta } from "@/lib/utils/status";

export default function SurgerySchedulePage() {
  const data = useHospital((s) => s.data);
  const router = useRouter();
  const name = (id: string) => { const p = data.patients.find((x) => x.id === id); return p ? fullName(p) : id; };

  const byRoom = useMemo(() => {
    const map: Record<string, typeof data.surgeries> = {};
    [...data.surgeries].sort((a, b) => (a.scheduledAt < b.scheduledAt ? -1 : 1)).forEach((s) => { (map[s.room] ??= []).push(s); });
    return map;
  }, [data.surgeries]);

  return (
    <PageContainer>
      <PageHeader title="Agenda quirúrgica" description="Programación por quirófano." icon={<CalendarDays className="h-5 w-5" />} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Object.entries(byRoom).map(([room, items]) => (
          <Section key={room} title={room} testId={`or-${room}`} actions={<Badge tone="neutral">{items.length}</Badge>}>
            <div className="space-y-2">
              {items.map((s) => (
                <button key={s.id} onClick={() => router.push(`/surgery/case/${s.id}`)} className="flex w-full items-center justify-between gap-2 rounded-md border border-ink-200 px-3 py-2 text-left text-sm hover:bg-ink-50">
                  <div><div className="font-medium text-ink-800">{s.procedure}</div><div className="text-2xs text-ink-400">{name(s.patientId)} · {formatDateTime(s.scheduledAt)}</div></div>
                  <Badge tone={surgeryStatusMeta(s.status).tone}>{surgeryStatusMeta(s.status).label}</Badge>
                </button>
              ))}
            </div>
          </Section>
        ))}
      </div>
    </PageContainer>
  );
}
