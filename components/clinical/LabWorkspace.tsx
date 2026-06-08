"use client";

import { useMemo, useState } from "react";
import { FlaskConical, FileText } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Section, Stat } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { DataTable, type Column } from "@/components/ui/Table";
import { useHospital } from "@/lib/store/useHospital";
import { useUI } from "@/lib/store/useUI";
import { LAB_CATALOG } from "@/lib/data/catalogs";
import { formatDateTime, fullName, relativeFromNow } from "@/lib/utils/format";
import { labStatusMeta, labFlagMeta, priorityMeta } from "@/lib/utils/status";
import type { LabOrder, LabResultItem } from "@/lib/types";

export function LabWorkspace({ defaultTab = "orders" }: { defaultTab?: string }) {
  const data = useHospital((s) => s.data);
  const setLabStatus = useHospital((s) => s.setLabStatus);
  const enterLabResults = useHospital((s) => s.enterLabResults);
  const acknowledgeLab = useHospital((s) => s.acknowledgeLab);
  const addToast = useUI((s) => s.addToast);
  const [editing, setEditing] = useState<LabOrder | null>(null);
  const [draft, setDraft] = useState<LabResultItem[]>([]);

  const name = (id: string) => { const p = data.patients.find((x) => x.id === id); return p ? fullName(p) : id; };

  const pending = useMemo(() => data.labs.filter((l) => l.status === "ordered" || l.status === "collected" || l.status === "processing"), [data.labs]);
  const resulted = useMemo(() => data.labs.filter((l) => l.status === "resulted" || l.status === "acknowledged"), [data.labs]);
  const critical = useMemo(() => data.labs.filter((l) => l.results?.some((r) => r.flag === "critico")), [data.labs]);

  const openEntry = (lab: LabOrder) => {
    const cat = LAB_CATALOG.find((c) => c.panel === lab.panel);
    setDraft((cat?.tests ?? []).map((t) => ({ test: t.test, value: "", unit: t.unit, referenceRange: t.referenceRange, flag: "normal" })));
    setEditing(lab);
  };
  const saveEntry = () => {
    if (!editing) return;
    enterLabResults(editing.id, draft);
    addToast({ title: "Resultados ingresados", description: editing.panel, variant: "success" });
    setEditing(null);
  };

  const pendingCols: Column<LabOrder>[] = [
    { key: "panel", header: "Panel", render: (l) => <div><div className="font-medium text-ink-900">{l.panel}</div><div className="text-2xs text-ink-400">{name(l.patientId)} · {l.sampleId}</div></div> },
    { key: "priority", header: "Prioridad", render: (l) => <Badge tone={priorityMeta(l.priority).tone}>{priorityMeta(l.priority).label}</Badge> },
    { key: "status", header: "Estado", render: (l) => <Badge tone={labStatusMeta(l.status).tone}>{labStatusMeta(l.status).label}</Badge> },
    { key: "ordered", header: "Ordenado", render: (l) => <span className="text-2xs text-ink-400">{relativeFromNow(l.orderedAt)}</span> },
    { key: "actions", header: "", align: "right", render: (l) => (
      <div className="flex justify-end gap-1.5">
        {l.status === "ordered" && <Button size="sm" variant="outline" onClick={() => { setLabStatus(l.id, "collected"); addToast({ title: "Muestra tomada", variant: "success" }); }} data-testid={`lab-collect-${l.id}`}>Tomar muestra</Button>}
        {l.status === "collected" && <Button size="sm" variant="outline" onClick={() => setLabStatus(l.id, "processing")} data-testid={`lab-process-${l.id}`}>Procesar</Button>}
        {(l.status === "processing" || l.status === "collected") && <Button size="sm" onClick={() => openEntry(l)} data-testid={`lab-enter-${l.id}`}>Ingresar resultados</Button>}
      </div>
    ) },
  ];

  return (
    <PageContainer>
      <PageHeader title="Laboratorio clínico (LIS)" description="Órdenes, seguimiento de muestras e ingreso de resultados." icon={<FlaskConical className="h-5 w-5" />} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Órdenes pendientes" value={pending.length} tone="amber" />
        <Stat label="Con resultado" value={resulted.length} tone="green" />
        <Stat label="Resultados críticos" value={critical.length} tone="red" />
        <Stat label="Total órdenes" value={data.labs.length} tone="blue" />
      </div>

      <Tabs defaultTab={defaultTab} tabs={[
        { key: "orders", label: "Órdenes pendientes", badge: <Badge tone="amber">{pending.length}</Badge>, content: (
          <DataTable columns={pendingCols} rows={pending} getRowId={(l) => l.id} testId="lab-pending-table" rowTestId={(l) => `lab-row-${l.id}`} empty="Sin órdenes pendientes." />
        ) },
        { key: "tracking", label: "Seguimiento de muestras", content: (
          <DataTable
            testId="lab-tracking-table"
            columns={[
              { key: "sample", header: "Muestra", render: (l: LabOrder) => <span className="font-mono text-xs">{l.sampleId ?? "—"}</span> },
              { key: "panel", header: "Panel", render: (l: LabOrder) => l.panel },
              { key: "patient", header: "Paciente", render: (l: LabOrder) => <span className="text-2xs">{name(l.patientId)}</span> },
              { key: "status", header: "Estado", render: (l: LabOrder) => <Badge tone={labStatusMeta(l.status).tone}>{labStatusMeta(l.status).label}</Badge> },
              { key: "sampleTime", header: "Toma", render: (l: LabOrder) => <span className="text-2xs text-ink-400">{l.sampleTime ? formatDateTime(l.sampleTime) : "—"}</span> },
              { key: "resultTime", header: "Resultado", render: (l: LabOrder) => <span className="text-2xs text-ink-400">{l.resultTime ? formatDateTime(l.resultTime) : "—"}</span> },
            ]}
            rows={data.labs}
            getRowId={(l) => l.id}
          />
        ) },
        { key: "results", label: "Resultados", badge: <Badge tone="green">{resulted.length}</Badge>, content: (
          <div className="space-y-3">
            {resulted.length === 0 && <p className="text-sm text-ink-400">Sin resultados.</p>}
            {resulted.slice(0, 30).map((l) => (
              <Section key={l.id} testId={`lab-result-${l.id}`} title={`${l.panel} · ${name(l.patientId)}`} actions={
                <div className="flex items-center gap-2">
                  {l.results?.some((r) => r.flag === "critico") && <Badge tone="red">Crítico</Badge>}
                  <Badge tone={labStatusMeta(l.status).tone}>{labStatusMeta(l.status).label}</Badge>
                  <Button size="sm" variant="ghost" onClick={() => addToast({ title: "PDF de resultado (demo)", variant: "info" })} data-testid={`lab-pdf-${l.id}`}><FileText className="h-3.5 w-3.5" /> PDF</Button>
                  {l.status !== "acknowledged" && <Button size="sm" variant="outline" onClick={() => { acknowledgeLab(l.id); addToast({ title: "Resultado reconocido", variant: "success" }); }} data-testid={`lab-ack-${l.id}`}>Reconocer</Button>}
                </div>
              }>
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-2xs uppercase text-ink-400"><th className="py-1">Prueba</th><th>Resultado</th><th>Unidad</th><th>Referencia</th><th>Bandera</th></tr></thead>
                  <tbody>
                    {l.results?.map((r, i) => (
                      <tr key={i} className="border-t border-ink-100">
                        <td className="py-1.5 text-ink-700">{r.test}</td>
                        <td className="font-medium text-ink-900">{r.value}</td>
                        <td className="text-ink-500">{r.unit}</td>
                        <td className="text-2xs text-ink-400">{r.referenceRange}</td>
                        <td><Badge tone={labFlagMeta(r.flag).tone}>{labFlagMeta(r.flag).label}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>
            ))}
          </div>
        ) },
      ]} />

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Ingresar resultados · ${editing?.panel ?? ""}`} testId="modal-lab-results" size="lg"
        footer={<><Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button><Button onClick={saveEntry} data-testid="lab-save-results">Guardar resultados</Button></>}>
        <div className="space-y-2">
          {draft.map((r, i) => (
            <div key={i} className="grid grid-cols-12 items-center gap-2">
              <span className="col-span-4 text-sm text-ink-700">{r.test}</span>
              <input data-testid={`lab-result-value-${i}`} aria-label={`Resultado ${r.test}`} value={r.value} onChange={(e) => setDraft((d) => d.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} className="field-input col-span-3" placeholder="Valor" />
              <span className="col-span-2 text-2xs text-ink-400">{r.unit} · {r.referenceRange}</span>
              <select data-testid={`lab-result-flag-${i}`} aria-label={`Bandera ${r.test}`} value={r.flag} onChange={(e) => setDraft((d) => d.map((x, j) => j === i ? { ...x, flag: e.target.value as LabResultItem["flag"] } : x))} className="field-input col-span-3">
                <option value="normal">Normal</option><option value="alto">Alto</option><option value="bajo">Bajo</option><option value="critico">Crítico</option>
              </select>
            </div>
          ))}
        </div>
      </Modal>
    </PageContainer>
  );
}
