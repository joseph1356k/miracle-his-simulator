"use client";

import { useMemo, useState } from "react";
import { ScanLine, AlertTriangle } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Section, Stat } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { DataTable, type Column } from "@/components/ui/Table";
import { useHospital } from "@/lib/store/useHospital";
import { useSession } from "@/lib/store/useSession";
import { useUI } from "@/lib/store/useUI";
import { IMAGING_MODALITIES } from "@/lib/data/catalogs";
import { fullName, formatDateTime, relativeFromNow, nowIso } from "@/lib/utils/format";
import { imagingStatusMeta, priorityMeta } from "@/lib/utils/status";
import type { ImagingOrder, ImagingReport } from "@/lib/types";

const EMPTY_REPORT = { indication: "", technique: "", findings: "", impression: "", recommendations: "", criticalCommunication: "", status: "preliminary" as "preliminary" | "final" };

export function ImagingWorkspace({ defaultTab = "queue" }: { defaultTab?: string }) {
  const data = useHospital((s) => s.data);
  const setImagingStatus = useHospital((s) => s.setImagingStatus);
  const saveImagingReport = useHospital((s) => s.saveImagingReport);
  const { userName } = useSession();
  const addToast = useUI((s) => s.addToast);
  const [modality, setModality] = useState("");
  const [editing, setEditing] = useState<ImagingOrder | null>(null);
  const [report, setReport] = useState({ ...EMPTY_REPORT });

  const name = (id: string) => { const p = data.patients.find((x) => x.id === id); return p ? fullName(p) : id; };
  const queue = useMemo(() => data.imaging.filter((i) => modality ? i.modality === modality : true), [data.imaging, modality]);
  const withReports = useMemo(() => data.imaging.filter((i) => i.report), [data.imaging]);

  const openReport = (o: ImagingOrder) => {
    setReport(o.report ? { indication: o.report.indication, technique: o.report.technique, findings: o.report.findings, impression: o.report.impression, recommendations: o.report.recommendations ?? "", criticalCommunication: o.report.criticalCommunication ?? "", status: o.report.status } : { ...EMPTY_REPORT, indication: o.study });
    setEditing(o);
  };
  const saveReport = () => {
    if (!editing) return;
    const r: ImagingReport = { ...report, radiologist: userName, reportedAt: nowIso() };
    saveImagingReport(editing.id, r);
    addToast({ title: `Informe ${report.status === "final" ? "final" : "preliminar"} guardado`, variant: "success" });
    setEditing(null);
  };

  const cols: Column<ImagingOrder>[] = [
    { key: "study", header: "Estudio", render: (o) => <div><div className="flex items-center gap-1.5 font-medium text-ink-900">{o.study}{o.criticalFinding && <Badge tone="red">Crítico</Badge>}</div><div className="text-2xs text-ink-400">{o.modality} · {name(o.patientId)}</div></div> },
    { key: "priority", header: "Prioridad", render: (o) => <Badge tone={priorityMeta(o.priority).tone}>{priorityMeta(o.priority).label}</Badge> },
    { key: "status", header: "Estado", render: (o) => <Badge tone={imagingStatusMeta(o.status).tone}>{imagingStatusMeta(o.status).label}</Badge> },
    { key: "ordered", header: "Ordenado", render: (o) => <span className="text-2xs text-ink-400">{relativeFromNow(o.orderedAt)}</span> },
    { key: "actions", header: "", align: "right", render: (o) => (
      <div className="flex justify-end gap-1.5">
        {o.status === "ordered" && <Button size="sm" variant="outline" onClick={() => setImagingStatus(o.id, "scheduled")} data-testid={`img-schedule-${o.id}`}>Programar</Button>}
        {o.status === "scheduled" && <Button size="sm" variant="outline" onClick={() => setImagingStatus(o.id, "acquired")} data-testid={`img-acquire-${o.id}`}>Adquirir</Button>}
        <Button size="sm" onClick={() => openReport(o)} data-testid={`img-report-${o.id}`}>Informe</Button>
      </div>
    ) },
  ];

  return (
    <PageContainer>
      <PageHeader title="Imágenes diagnósticas (RIS/PACS)" description="Cola de estudios, programación e informes radiológicos." icon={<ScanLine className="h-5 w-5" />} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="En cola" value={data.imaging.filter((i) => i.status === "ordered" || i.status === "scheduled").length} tone="amber" />
        <Stat label="Con informe" value={withReports.length} tone="green" />
        <Stat label="Hallazgos críticos" value={data.imaging.filter((i) => i.criticalFinding).length} tone="red" />
        <Stat label="Total estudios" value={data.imaging.length} tone="blue" />
      </div>

      <Tabs defaultTab={defaultTab} tabs={[
        { key: "queue", label: "Cola de estudios", content: (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-2xs font-semibold uppercase text-ink-400">Modalidad</span>
              <Button size="sm" variant={modality === "" ? "primary" : "outline"} onClick={() => setModality("")}>Todas</Button>
              {IMAGING_MODALITIES.map((m) => <Button key={m} size="sm" variant={modality === m ? "primary" : "outline"} onClick={() => setModality(m)} data-testid={`img-filter-${m}`}>{m}</Button>)}
            </div>
            <DataTable columns={cols} rows={queue} getRowId={(o) => o.id} testId="imaging-queue-table" rowTestId={(o) => `imaging-row-${o.id}`} />
          </div>
        ) },
        { key: "reports", label: "Informes", badge: <Badge tone="green">{withReports.length}</Badge>, content: (
          <div className="space-y-3">
            {withReports.slice(0, 25).map((o) => (
              <Section key={o.id} testId={`imaging-report-${o.id}`} title={`${o.study} · ${name(o.patientId)}`} actions={<div className="flex items-center gap-2">{o.criticalFinding && <Badge tone="red">Crítico</Badge>}<Badge tone={imagingStatusMeta(o.status).tone}>{imagingStatusMeta(o.status).label}</Badge><Button size="sm" variant="outline" onClick={() => openReport(o)}>Editar</Button></div>}>
                <dl className="grid gap-1.5 text-sm sm:grid-cols-2">
                  <Field label="Indicación" value={o.report?.indication} />
                  <Field label="Técnica" value={o.report?.technique} />
                  <Field label="Hallazgos" value={o.report?.findings} full />
                  <Field label="Impresión" value={o.report?.impression} full />
                  {o.report?.criticalCommunication && <Field label="Comunicación crítica" value={o.report.criticalCommunication} full />}
                  <Field label="Radiólogo" value={o.report?.radiologist} />
                </dl>
              </Section>
            ))}
          </div>
        ) },
      ]} />

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Informe radiológico · ${editing?.study ?? ""}`} testId="modal-imaging-report" size="lg"
        footer={<><Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button><Button onClick={saveReport} data-testid="imaging-save-report">Guardar informe</Button></>}>
        <div className="space-y-3">
          {([["indication", "Indicación"], ["technique", "Técnica"], ["findings", "Hallazgos"], ["impression", "Impresión"], ["recommendations", "Recomendaciones"], ["criticalCommunication", "Comunicación crítica"]] as const).map(([k, label]) => (
            <div key={k}>
              <label htmlFor={`imgr-${k}`} className="field-label">{label}</label>
              <textarea id={`imgr-${k}`} data-testid={`field-imaging-${k}`} aria-label={label} rows={k === "findings" ? 3 : 2} value={(report as any)[k]} onChange={(e) => setReport((r) => ({ ...r, [k]: e.target.value }))} className="field-input" />
            </div>
          ))}
          <div>
            <label htmlFor="imgr-status" className="field-label">Estado del informe</label>
            <select id="imgr-status" data-testid="field-imaging-status" aria-label="Estado del informe" value={report.status} onChange={(e) => setReport((r) => ({ ...r, status: e.target.value as "preliminary" | "final" }))} className="field-input">
              <option value="preliminary">Preliminar</option><option value="final">Final</option>
            </select>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}

function Field({ label, value, full }: { label: string; value?: string; full?: boolean }) {
  return <div className={full ? "sm:col-span-2" : ""}><dt className="text-2xs font-semibold uppercase text-ink-400">{label}</dt><dd className="text-ink-700">{value || "—"}</dd></div>;
}
