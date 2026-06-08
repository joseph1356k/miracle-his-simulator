"use client";

import { useMemo } from "react";
import { BarChart3, Clock, BedDouble, Activity, ShieldCheck } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Section, Stat } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useHospital } from "@/lib/store/useHospital";
import { cn } from "@/lib/utils/cn";

function MiniBars({ data, unit }: { data: { label: string; value: number }[]; unit?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-2">
          <span className="w-40 truncate text-2xs text-ink-500">{d.label}</span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-ink-100">
            <div className={cn("h-full rounded-full bg-clinical-500")} style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
          <span className="w-14 text-right text-2xs font-medium text-ink-700">{d.value}{unit}</span>
        </div>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const data = useHospital((s) => s.data);

  const kpis = useMemo(() => {
    const emerg = data.encounters.filter((e) => e.type === "emergency");
    const avgWait = emerg.length ? Math.round(emerg.reduce((a, e) => a + (e.triage?.waitMinutes ?? 0), 0) / emerg.length) : 0;
    const inpatient = data.encounters.filter((e) => e.type === "inpatient");
    const avgLos = inpatient.length ? Math.round(inpatient.reduce((a, e) => a + (Date.now() - new Date(e.startedAt).getTime()) / 86400000, 0) / inpatient.length) : 0;
    const marTotal = data.medications.flatMap((m) => m.schedule);
    const adminRate = marTotal.length ? Math.round((marTotal.filter((e) => e.status === "administered").length / marTotal.length) * 100) : 0;
    const signedNotes = data.notes.filter((n) => n.status === "signed").length;
    const docCompleteness = data.notes.length ? Math.round((signedNotes / data.notes.length) * 100) : 0;
    return { avgWait, avgLos, adminRate, docCompleteness, bedOccupancy: Math.round((inpatient.length / 96) * 100) };
  }, [data]);

  const triageVolume = useMemo(() => [1, 2, 3, 4, 5].map((l) => ({ label: `Triage ${l}`, value: data.encounters.filter((e) => e.type === "emergency" && e.triage?.level === l).length })), [data.encounters]);
  const byWard = useMemo(() => {
    const map: Record<string, number> = {};
    data.encounters.filter((e) => e.type === "inpatient" || e.type === "icu").forEach((e) => { map[e.ward ?? "—"] = (map[e.ward ?? "—"] ?? 0) + 1; });
    return Object.entries(map).map(([label, value]) => ({ label, value }));
  }, [data.encounters]);

  return (
    <PageContainer>
      <PageHeader title="Reportes e inteligencia de negocio" description="Indicadores hospitalarios (datos demostrativos)." icon={<BarChart3 className="h-5 w-5" />} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Espera urgencias" value={`${kpis.avgWait}m`} tone="amber" icon={<Clock className="h-4 w-4" />} />
        <Stat label="Estancia media" value={`${kpis.avgLos}d`} tone="blue" icon={<BedDouble className="h-4 w-4" />} />
        <Stat label="Ocupación camas" value={`${kpis.bedOccupancy}%`} tone="teal" />
        <Stat label="Cumpl. eMAR" value={`${kpis.adminRate}%`} tone="green" icon={<Activity className="h-4 w-4" />} />
        <Stat label="Doc. completa" value={`${kpis.docCompleteness}%`} />
        <Stat label="Precisión Miracle" value="92%" tone="blue" icon={<ShieldCheck className="h-4 w-4" />} hint="Métrica demo" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Volumen de triage" testId="section-triage-volume"><MiniBars data={triageVolume} /></Section>
        <Section title="Ocupación por servicio" testId="section-ward-occupancy"><MiniBars data={byWard} /></Section>
        <Section title="Tiempos de respuesta (demo)" testId="section-turnaround">
          <MiniBars data={[{ label: "Lab turnaround", value: 48 }, { label: "Imágenes turnaround", value: 72 }, { label: "Autorización EPS", value: 36 }]} unit="m" />
        </Section>
        <Section title="Indicadores administrativos" testId="section-admin-kpis">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Altas pendientes" value={data.encounters.filter((e) => e.status === "admitted").length} />
            <Stat label="Reingresos (demo)" value={3} />
            <Stat label="Autorizaciones en demora" value={data.authorizations.filter((a) => a.delayHours > 24).length} tone="red" />
            <Stat label="Eventos auditados" value={data.audit.length} />
          </div>
        </Section>
      </div>

      <p className="text-2xs text-ink-400">Las cifras son sintéticas y demostrativas. No representan indicadores reales.</p>
    </PageContainer>
  );
}
