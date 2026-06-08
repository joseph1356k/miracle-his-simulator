"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Plus } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Card, Stat } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useHospital } from "@/lib/store/useHospital";
import { useUI } from "@/lib/store/useUI";
import { fullName, relativeFromNow } from "@/lib/utils/format";
import { orderStatusMeta, priorityMeta } from "@/lib/utils/status";
import type { Order, OrderCategory } from "@/lib/types";

const CATEGORY_LABEL: Record<OrderCategory, string> = {
  laboratory: "Laboratorio", imaging: "Imágenes", medication: "Medicamento", nursing: "Enfermería",
  diet: "Dieta", procedure: "Procedimiento", interconsultation: "Interconsulta", therapy: "Terapia",
  "blood-bank": "Banco de sangre", isolation: "Aislamiento", monitoring: "Monitoreo", discharge: "Egreso",
};

export default function OrdersPage() {
  const data = useHospital((s) => s.data);
  const setOrderStatus = useHospital((s) => s.setOrderStatus);
  const addToast = useUI((s) => s.addToast);
  const router = useRouter();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [status, setStatus] = useState("");

  const name = (id: string) => { const p = data.patients.find((x) => x.id === id); return p ? fullName(p) : id; };

  const filtered = useMemo(() => data.orders.filter((o) => {
    if (cat && o.category !== cat) return false;
    if (status && o.status !== status) return false;
    if (q) { const t = q.toLowerCase(); return o.name.toLowerCase().includes(t) || name(o.patientId).toLowerCase().includes(t); }
    return true;
  }), [data.orders, q, cat, status]);

  const counts = useMemo(() => ({
    draft: data.orders.filter((o) => o.status === "draft").length,
    inProgress: data.orders.filter((o) => o.status === "in-progress").length,
    completed: data.orders.filter((o) => o.status === "completed").length,
    flagged: data.orders.filter((o) => o.flags.length > 0).length,
  }), [data.orders]);

  const columns: Column<Order>[] = [
    { key: "name", header: "Orden", render: (o) => (
      <div>
        <div className="flex items-center gap-1.5"><span className="font-medium text-ink-900">{o.name}</span>{o.flags.map((f) => <Badge key={f} tone="red">{f}</Badge>)}</div>
        <div className="text-2xs text-ink-400">{CATEGORY_LABEL[o.category]} · {name(o.patientId)}</div>
      </div>
    ) },
    { key: "priority", header: "Prioridad", render: (o) => <Badge tone={priorityMeta(o.priority).tone}>{priorityMeta(o.priority).label}</Badge> },
    { key: "status", header: "Estado", render: (o) => <Badge tone={orderStatusMeta(o.status).tone}>{orderStatusMeta(o.status).label}</Badge> },
    { key: "time", header: "Creada", render: (o) => <span className="text-2xs text-ink-400">{relativeFromNow(o.createdAt)}</span> },
    { key: "actions", header: "", align: "right", render: (o) => (
      <div className="flex justify-end gap-1.5">
        {o.status === "draft" && <Button size="sm" onClick={(e) => { e.stopPropagation(); setOrderStatus(o.id, "signed"); addToast({ title: "Orden firmada", variant: "success" }); }} data-testid={`order-sign-${o.id}`}>Firmar</Button>}
        {(o.status === "signed" || o.status === "sent") && <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setOrderStatus(o.id, "in-progress"); }} data-testid={`order-progress-${o.id}`}>En proceso</Button>}
        {o.status !== "cancelled" && o.status !== "completed" && <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setOrderStatus(o.id, "cancelled"); addToast({ title: "Orden cancelada", variant: "warning" }); }} data-testid={`order-cancel-${o.id}`}>Cancelar</Button>}
      </div>
    ) },
  ];

  return (
    <PageContainer>
      <PageHeader title="Órdenes médicas (CPOE)" description="Entrada de órdenes: laboratorio, imágenes, medicamentos, enfermería y más." icon={<ClipboardList className="h-5 w-5" />} actions={<Button onClick={() => router.push("/orders/new")} data-testid="orders-new"><Plus className="h-4 w-4" /> Nueva orden</Button>} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Por firmar" value={counts.draft} tone="amber" onClick={() => setStatus("draft")} />
        <Stat label="En proceso" value={counts.inProgress} tone="blue" onClick={() => setStatus("in-progress")} />
        <Stat label="Completadas" value={counts.completed} tone="green" onClick={() => setStatus("completed")} />
        <Stat label="Con alertas" value={counts.flagged} tone="red" />
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <input data-testid="orders-search" aria-label="Buscar órdenes" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar orden o paciente…" className="h-9 min-w-[220px] flex-1 rounded-md border border-ink-200 px-2.5 text-sm" />
          <select aria-label="Categoría" data-testid="orders-filter-category" value={cat} onChange={(e) => setCat(e.target.value)} className="h-9 rounded-md border border-ink-200 px-2 text-sm">
            <option value="">Todas las categorías</option>
            {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select aria-label="Estado" data-testid="orders-filter-status" value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-md border border-ink-200 px-2 text-sm">
            <option value="">Todos los estados</option>
            {["draft", "signed", "sent", "in-progress", "completed", "cancelled", "rejected"].map((s) => <option key={s} value={s}>{orderStatusMeta(s).label}</option>)}
          </select>
          <Badge tone="neutral">{filtered.length}</Badge>
        </div>
      </Card>

      <DataTable columns={columns} rows={filtered} getRowId={(o) => o.id} onRowClick={(o) => router.push(`/orders/${o.id}`)} rowTestId={(o) => `order-row-${o.id}`} testId="orders-table" />
    </PageContainer>
  );
}
