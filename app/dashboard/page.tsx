"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Ambulance, BedDouble, ClipboardSignature, FileWarning, FlaskConical,
  LayoutDashboard, Pill, ShieldAlert, Stethoscope, TriangleAlert, Users, Activity,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Card, CardBody, CardHeader, Stat } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useHospital } from "@/lib/store/useHospital";
import { useSession } from "@/lib/store/useSession";
import { useUI } from "@/lib/store/useUI";
import { ageFromBirthDate, fullName, relativeFromNow } from "@/lib/utils/format";
import { triageLevelMeta, priorityMeta, taskStatusMeta } from "@/lib/utils/status";

export default function DashboardPage() {
  const data = useHospital((s) => s.data);
  const setOrderStatus = useHospital((s) => s.setOrderStatus);
  const selectPatient = useSession((s) => s.selectPatient);
  const addToast = useUI((s) => s.addToast);
  const router = useRouter();

  const m = useMemo(() => {
    const patientName = (id: string) => {
      const p = data.patients.find((x) => x.id === id);
      return p ? fullName(p) : id;
    };
    const emergencyQueue = data.encounters
      .filter((e) => e.type === "emergency")
      .sort((a, b) => (a.triage?.level ?? 5) - (b.triage?.level ?? 5));
    const waitingTriage = emergencyQueue.filter((e) => e.status === "waiting").length;
    const ordersToSign = data.orders.filter((o) => o.status === "draft");
    const criticalLabs = data.labs.filter((l) => l.results?.some((r) => r.flag === "critico"));
    const criticalImaging = data.imaging.filter((i) => i.criticalFinding);
    const admitted = data.encounters.filter((e) => (e.type === "inpatient" || e.type === "icu") && e.status === "admitted");
    const bedsTotal = 140;
    const pendingLabs = data.labs.filter((l) => ["ordered", "collected", "processing"].includes(l.status));
    const pendingRadiology = data.imaging.filter((i) => i.status !== "final" && i.status !== "cancelled");
    const medAlerts = data.medications.filter((x) => x.flags.length > 0 || x.validationStatus === "pending");
    const pendingAuth = data.authorizations.filter((a) => a.status === "pending" || a.status === "docs-required");
    const nurseTasks = data.nursingTasks.filter((t) => t.status === "pending" || t.status === "overdue");
    const highRisk = data.patients.filter((p) => p.riskFlags.length > 0).slice(0, 8);
    const epicrisisPending = admitted.slice(0, 6);
    return {
      patientName, emergencyQueue, waitingTriage, ordersToSign, criticalLabs, criticalImaging,
      admitted, bedsTotal, bedsAvailable: bedsTotal - admitted.length, pendingLabs, pendingRadiology,
      medAlerts, pendingAuth, nurseTasks, highRisk, epicrisisPending,
    };
  }, [data]);

  const goPatient = (patientId: string, href: string) => { selectPatient(patientId); router.push(href); };

  return (
    <PageContainer>
      <PageHeader
        title="Inicio — Tablero clínico"
        description="Carga asistencial del día, colas y tareas pendientes. Datos sintéticos de demostración."
        icon={<LayoutDashboard className="h-5 w-5" />}
        badge={<Badge tone="amber">Demo</Badge>}
        actions={<Button variant="outline" onClick={() => router.push("/miracle-test-lab")} data-testid="dashboard-open-miracle"><FlaskConical className="h-4 w-4" /> Miracle Test Lab</Button>}
      />

      {/* KPI widgets */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <Stat testId="widget-waiting-triage" label="Esperando triage" value={m.waitingTriage} tone="amber" icon={<Ambulance className="h-4 w-4" />} hint="Pacientes en urgencias" onClick={() => router.push("/emergency/triage")} />
        <Stat testId="widget-orders-to-sign" label="Órdenes por firmar" value={m.ordersToSign.length} tone="blue" icon={<ClipboardSignature className="h-4 w-4" />} hint="Pendientes de firma" onClick={() => router.push("/orders")} />
        <Stat testId="widget-critical-results" label="Resultados críticos" value={m.criticalLabs.length + m.criticalImaging.length} tone="red" icon={<ShieldAlert className="h-4 w-4" />} hint="Lab + imágenes" onClick={() => router.push("/lab/results")} />
        <Stat testId="widget-beds-available" label="Camas disponibles" value={m.bedsAvailable} tone="green" icon={<BedDouble className="h-4 w-4" />} hint={`de ${m.bedsTotal} camas`} onClick={() => router.push("/inpatient/bed-board")} />
        <Stat testId="widget-meds-pending" label="Medicamentos pend." value={m.medAlerts.length} tone="amber" icon={<Pill className="h-4 w-4" />} hint="Validación / alertas" onClick={() => router.push("/medications")} />
        <Stat testId="widget-epicrisis-pending" label="Epicrisis pendientes" value={m.epicrisisPending.length} tone="default" icon={<FileWarning className="h-4 w-4" />} hint="Egresos por documentar" onClick={() => router.push("/discharge")} />
        <Stat testId="widget-auth-pending" label="Autorizaciones EPS" value={m.pendingAuth.length} tone="default" icon={<TriangleAlert className="h-4 w-4" />} hint="En espera" onClick={() => router.push("/billing/authorizations")} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Emergency queue */}
        <Card className="xl:col-span-2">
          <CardHeader title="Cola de urgencias" subtitle="Pacientes esperando atención, ordenados por triage" icon={<Ambulance className="h-4 w-4" />} actions={<Button size="sm" variant="ghost" onClick={() => router.push("/emergency")}>Ver urgencias</Button>} />
          <CardBody className="space-y-1.5">
            {m.emergencyQueue.slice(0, 6).map((e) => {
              const tl = triageLevelMeta(e.triage?.level);
              return (
                <button key={e.id} data-testid={`dashboard-emergency-${e.id}`} onClick={() => goPatient(e.patientId, `/emergency/encounter/${e.id}`)} className="flex w-full items-center gap-3 rounded-md border border-ink-200 px-3 py-2 text-left hover:bg-clinical-50/50">
                  <Badge tone={tl.tone}>{tl.label}</Badge>
                  <span className="flex-1">
                    <span className="text-sm font-medium text-ink-800">{m.patientName(e.patientId)}</span>
                    <span className="ml-2 text-2xs text-ink-500">{e.reason}</span>
                  </span>
                  <span className="text-2xs text-ink-400">{e.triage?.assignedBox} · {relativeFromNow(e.startedAt)}</span>
                </button>
              );
            })}
          </CardBody>
        </Card>

        {/* Critical results */}
        <Card>
          <CardHeader title="Resultados críticos" subtitle="Requieren reconocimiento clínico" icon={<ShieldAlert className="h-4 w-4 text-rose-500" />} />
          <CardBody className="space-y-1.5">
            {[...m.criticalLabs.slice(0, 4), ...m.criticalImaging.slice(0, 3)].length === 0 && <p className="text-sm text-ink-400">Sin resultados críticos.</p>}
            {m.criticalLabs.slice(0, 4).map((l) => (
              <button key={l.id} onClick={() => goPatient(l.patientId, "/lab/results")} className="flex w-full items-center justify-between gap-2 rounded-md border border-rose-200 bg-rose-50/50 px-3 py-2 text-left hover:bg-rose-50">
                <span><span className="text-sm font-medium text-ink-800">{l.panel}</span><span className="ml-2 text-2xs text-ink-500">{m.patientName(l.patientId)}</span></span>
                <Badge tone="red">Crítico</Badge>
              </button>
            ))}
            {m.criticalImaging.slice(0, 3).map((i) => (
              <button key={i.id} onClick={() => goPatient(i.patientId, "/imaging/reports")} className="flex w-full items-center justify-between gap-2 rounded-md border border-rose-200 bg-rose-50/50 px-3 py-2 text-left hover:bg-rose-50">
                <span><span className="text-sm font-medium text-ink-800">{i.study}</span><span className="ml-2 text-2xs text-ink-500">{m.patientName(i.patientId)}</span></span>
                <Badge tone="red">Hallazgo</Badge>
              </button>
            ))}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Orders to sign (doctor tasks) */}
        <Card>
          <CardHeader title="Órdenes pendientes por firmar" subtitle="Lista de tareas del médico" icon={<Stethoscope className="h-4 w-4" />} />
          <CardBody className="space-y-1.5">
            {m.ordersToSign.slice(0, 6).map((o) => (
              <div key={o.id} className="flex items-center gap-2 rounded-md border border-ink-200 px-3 py-2">
                <Badge tone={priorityMeta(o.priority).tone}>{priorityMeta(o.priority).label}</Badge>
                <span className="flex-1 text-sm text-ink-800">{o.name}</span>
                <Button size="sm" data-testid={`dashboard-sign-${o.id}`} onClick={() => { setOrderStatus(o.id, "signed"); addToast({ title: "Orden firmada", description: o.name, variant: "success" }); }}>Firmar</Button>
              </div>
            ))}
            {m.ordersToSign.length === 0 && <p className="text-sm text-ink-400">No hay órdenes pendientes.</p>}
          </CardBody>
        </Card>

        {/* Nurse tasks */}
        <Card>
          <CardHeader title="Tareas de enfermería" subtitle="Pendientes y vencidas" icon={<Activity className="h-4 w-4" />} actions={<Button size="sm" variant="ghost" onClick={() => router.push("/nursing/tasks")}>Ver</Button>} />
          <CardBody className="space-y-1.5">
            {m.nurseTasks.slice(0, 6).map((t) => (
              <div key={t.id} className="flex items-center gap-2 rounded-md border border-ink-200 px-3 py-2">
                <Badge tone={taskStatusMeta(t.status).tone}>{taskStatusMeta(t.status).label}</Badge>
                <span className="flex-1 text-sm text-ink-800">{t.type}</span>
                <span className="text-2xs text-ink-400">{m.patientName(t.patientId)}</span>
              </div>
            ))}
            {m.nurseTasks.length === 0 && <p className="text-sm text-ink-400">Sin tareas pendientes.</p>}
          </CardBody>
        </Card>

        {/* High risk */}
        <Card>
          <CardHeader title="Pacientes de alto riesgo" subtitle="Banderas de riesgo activas" icon={<Users className="h-4 w-4" />} />
          <CardBody className="space-y-1.5">
            {m.highRisk.map((p) => (
              <button key={p.id} onClick={() => goPatient(p.id, `/patients/${p.id}`)} className="flex w-full items-center justify-between gap-2 rounded-md border border-ink-200 px-3 py-2 text-left hover:bg-clinical-50/50">
                <span><span className="text-sm font-medium text-ink-800">{fullName(p)}</span><span className="ml-2 text-2xs text-ink-400">{ageFromBirthDate(p.birthDate)}a</span></span>
                <span className="flex gap-1">{p.riskFlags.slice(0, 2).map((r) => <Badge key={r} tone="amber">{r}</Badge>)}</span>
              </button>
            ))}
          </CardBody>
        </Card>
      </div>
    </PageContainer>
  );
}
