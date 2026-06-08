"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Inbox, ShieldAlert, ClipboardSignature, FileWarning, Activity, CreditCard } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useHospital } from "@/lib/store/useHospital";
import { useSession } from "@/lib/store/useSession";
import { useUI } from "@/lib/store/useUI";
import { fullName, relativeFromNow } from "@/lib/utils/format";
import { priorityMeta, taskStatusMeta } from "@/lib/utils/status";

export default function ClinicalInboxPage() {
  const data = useHospital((s) => s.data);
  const setOrderStatus = useHospital((s) => s.setOrderStatus);
  const acknowledgeLab = useHospital((s) => s.acknowledgeLab);
  const selectPatient = useSession((s) => s.selectPatient);
  const addToast = useUI((s) => s.addToast);
  const router = useRouter();

  const name = (id: string) => { const p = data.patients.find((x) => x.id === id); return p ? fullName(p) : id; };

  const m = useMemo(() => ({
    criticalLabs: data.labs.filter((l) => l.results?.some((r) => r.flag === "critico") && l.status !== "acknowledged"),
    ordersToSign: data.orders.filter((o) => o.status === "draft"),
    unsignedNotes: data.notes.filter((n) => n.status === "draft"),
    nurseTasks: data.nursingTasks.filter((t) => t.status === "pending" || t.status === "overdue"),
    pendingAuth: data.authorizations.filter((a) => a.status === "pending" || a.status === "docs-required"),
  }), [data]);

  return (
    <PageContainer>
      <PageHeader title="Bandeja clínica" description="Pendientes que requieren su acción, agrupados por tipo." icon={<Inbox className="h-5 w-5" />} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Resultados críticos por reconocer" icon={<ShieldAlert className="h-4 w-4 text-rose-500" />} actions={<Badge tone="red">{m.criticalLabs.length}</Badge>} />
          <CardBody className="space-y-1.5">
            {m.criticalLabs.length === 0 && <p className="text-sm text-ink-400">Nada pendiente.</p>}
            {m.criticalLabs.map((l) => (
              <div key={l.id} className="flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50/50 px-3 py-2">
                <span className="flex-1 text-sm"><span className="font-medium text-ink-800">{l.panel}</span> <span className="text-2xs text-ink-500">· {name(l.patientId)}</span></span>
                <Button size="sm" onClick={() => { acknowledgeLab(l.id); addToast({ title: "Resultado reconocido", variant: "success" }); }} data-testid={`inbox-ack-${l.id}`}>Reconocer</Button>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Órdenes por firmar" icon={<ClipboardSignature className="h-4 w-4 text-clinical-500" />} actions={<Badge tone="blue">{m.ordersToSign.length}</Badge>} />
          <CardBody className="space-y-1.5">
            {m.ordersToSign.slice(0, 8).map((o) => (
              <div key={o.id} className="flex items-center gap-2 rounded-md border border-ink-200 px-3 py-2">
                <Badge tone={priorityMeta(o.priority).tone}>{priorityMeta(o.priority).label}</Badge>
                <span className="flex-1 text-sm text-ink-800">{o.name}</span>
                <Button size="sm" variant="outline" onClick={() => { setOrderStatus(o.id, "signed"); addToast({ title: "Orden firmada", variant: "success" }); }} data-testid={`inbox-sign-${o.id}`}>Firmar</Button>
              </div>
            ))}
            {m.ordersToSign.length === 0 && <p className="text-sm text-ink-400">Nada pendiente.</p>}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Notas sin firmar" icon={<FileWarning className="h-4 w-4 text-amber-500" />} actions={<Badge tone="amber">{m.unsignedNotes.length}</Badge>} />
          <CardBody className="space-y-1.5">
            {m.unsignedNotes.slice(0, 8).map((n) => (
              <button key={n.id} onClick={() => { selectPatient(n.patientId); router.push("/documentation"); }} className="flex w-full items-center justify-between gap-2 rounded-md border border-ink-200 px-3 py-2 text-left hover:bg-ink-50">
                <span className="text-sm text-ink-800">{n.title} <span className="text-2xs text-ink-500">· {name(n.patientId)}</span></span>
                <span className="text-2xs text-ink-400">{relativeFromNow(n.createdAt)}</span>
              </button>
            ))}
            {m.unsignedNotes.length === 0 && <p className="text-sm text-ink-400">Nada pendiente.</p>}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Tareas de enfermería" icon={<Activity className="h-4 w-4 text-emerald-500" />} actions={<Badge tone="neutral">{m.nurseTasks.length}</Badge>} />
          <CardBody className="space-y-1.5">
            {m.nurseTasks.slice(0, 8).map((t) => (
              <div key={t.id} className="flex items-center gap-2 rounded-md border border-ink-200 px-3 py-2">
                <Badge tone={taskStatusMeta(t.status).tone}>{taskStatusMeta(t.status).label}</Badge>
                <span className="flex-1 text-sm text-ink-800">{t.type}</span>
                <span className="text-2xs text-ink-400">{name(t.patientId)}</span>
              </div>
            ))}
            {m.nurseTasks.length === 0 && <p className="text-sm text-ink-400">Nada pendiente.</p>}
          </CardBody>
        </Card>
      </div>
    </PageContainer>
  );
}
