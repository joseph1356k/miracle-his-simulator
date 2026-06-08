"use client";

import { useParams, useRouter } from "next/navigation";
import { ClipboardList, ArrowLeft } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Section } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useHospital } from "@/lib/store/useHospital";
import { useUI } from "@/lib/store/useUI";
import { formatDateTime, fullName } from "@/lib/utils/format";
import { orderStatusMeta, priorityMeta } from "@/lib/utils/status";
import type { OrderStatus } from "@/lib/types";

const FLOW: OrderStatus[] = ["draft", "signed", "sent", "in-progress", "completed"];

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const data = useHospital((s) => s.data);
  const setOrderStatus = useHospital((s) => s.setOrderStatus);
  const addToast = useUI((s) => s.addToast);
  const order = data.orders.find((o) => o.id === params.id);
  const patient = data.patients.find((p) => p.id === order?.patientId);

  if (!order) return <PageContainer><p className="text-sm text-ink-500">Orden no encontrada.</p></PageContainer>;

  const idx = FLOW.indexOf(order.status);

  return (
    <PageContainer>
      <PageHeader
        title={order.name}
        description={`Orden ${order.id} · ${patient ? fullName(patient) : ""}`}
        icon={<ClipboardList className="h-5 w-5" />}
        badge={<Badge tone={orderStatusMeta(order.status).tone}>{orderStatusMeta(order.status).label}</Badge>}
        actions={<Button variant="ghost" onClick={() => router.push("/orders")}><ArrowLeft className="h-4 w-4" /> Volver</Button>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Section title="Detalle de la orden" testId="section-order-detail" className="lg:col-span-2">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            <Row label="Categoría" value={order.category} />
            <Row label="Prioridad" value={<Badge tone={priorityMeta(order.priority).tone}>{priorityMeta(order.priority).label}</Badge>} />
            <Row label="Indicación" value={order.indication ?? "—"} />
            <Row label="Frecuencia" value={order.frequency ?? "—"} />
            <Row label="Programación" value={order.schedule ?? "—"} />
            <Row label="Inicio" value={order.startDate ?? "—"} />
            <Row label="Fin" value={order.stopDate ?? "—"} />
            <Row label="Ordenada por" value={order.orderedBy} />
            <Row label="Creada" value={formatDateTime(order.createdAt)} />
            <Row label="Firmada" value={order.signedAt ? formatDateTime(order.signedAt) : "—"} />
          </dl>
          {order.flags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">{order.flags.map((f) => <Badge key={f} tone="red">{f}</Badge>)}</div>
          )}
        </Section>

        <Section title="Estado y acciones" testId="section-order-actions">
          <ol className="mb-4 space-y-2">
            {FLOW.map((s, i) => (
              <li key={s} className="flex items-center gap-2 text-sm">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-2xs ${i <= idx ? "bg-clinical-600 text-white" : "bg-ink-100 text-ink-400"}`}>{i + 1}</span>
                <span className={i <= idx ? "text-ink-800" : "text-ink-400"}>{orderStatusMeta(s).label}</span>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-2">
            {order.status === "draft" && <Button size="sm" onClick={() => { setOrderStatus(order.id, "signed"); addToast({ title: "Orden firmada", variant: "success" }); }} data-testid="button-sign-order">Firmar</Button>}
            {order.status === "signed" && <Button size="sm" onClick={() => setOrderStatus(order.id, "sent")}>Enviar</Button>}
            {order.status === "sent" && <Button size="sm" onClick={() => setOrderStatus(order.id, "in-progress")}>En proceso</Button>}
            {order.status === "in-progress" && <Button size="sm" onClick={() => { setOrderStatus(order.id, "completed"); addToast({ title: "Orden completada", variant: "success" }); }}>Completar</Button>}
            {order.status !== "cancelled" && order.status !== "completed" && <Button size="sm" variant="ghost" onClick={() => { setOrderStatus(order.id, "cancelled"); addToast({ title: "Orden cancelada", variant: "warning" }); }} data-testid="button-cancel-order">Cancelar</Button>}
          </div>
        </Section>
      </div>
    </PageContainer>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><dt className="text-2xs font-medium uppercase tracking-wide text-ink-400">{label}</dt><dd className="text-ink-800">{value}</dd></div>;
}
