"use client";

import { useMemo, useState } from "react";
import { Activity, Save } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Section, Stat } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/Table";
import { TextField, TextAreaField, SelectField } from "@/components/ui/Field";
import { SelectedPatientBanner } from "@/components/clinical/SelectedPatientBanner";
import { useSelected } from "@/lib/hooks/useSelected";
import { useHospital } from "@/lib/store/useHospital";
import { useSession } from "@/lib/store/useSession";
import { useUI } from "@/lib/store/useUI";
import { genId } from "@/lib/utils/id";
import { nowIso, fullName, formatDateTime } from "@/lib/utils/format";
import { taskStatusMeta, priorityMeta } from "@/lib/utils/status";
import type { NursingTask, VitalSigns } from "@/lib/types";

const EMPTY_VITALS = { temperature: "", heartRate: "", respiratoryRate: "", systolic: "", diastolic: "", spo2: "", oxygenSupport: "Ambiente", painScale: "", glucose: "", weight: "", height: "", neuroStatus: "Alerta", comments: "" };

export function NursingWorkspace({ defaultTab = "tasks" }: { defaultTab?: string }) {
  const { patient, encounter } = useSelected();
  const data = useHospital((s) => s.data);
  const setNursingTaskStatus = useHospital((s) => s.setNursingTaskStatus);
  const addVitals = useHospital((s) => s.addVitals);
  const addNote = useHospital((s) => s.addNote);
  const { userName, roleId } = useSession();
  const addToast = useUI((s) => s.addToast);

  const [v, setV] = useState({ ...EMPTY_VITALS });
  const updV = (k: string, val: string) => setV((s) => ({ ...s, [k]: val }));
  const [note, setNote] = useState({ nursingNote: "", carePlan: "", observations: "", education: "" });
  const updN = (k: string, val: string) => setNote((s) => ({ ...s, [k]: val }));

  const name = (id: string) => { const p = data.patients.find((x) => x.id === id); return p ? fullName(p) : id; };
  const patientVitals = useMemo(() => data.vitals.filter((x) => x.patientId === patient?.id).slice(0, 8), [data.vitals, patient]);

  const saveVitals = () => {
    if (!patient) { addToast({ title: "Seleccione un paciente", variant: "warning" }); return; }
    const n = (x: string) => (x ? Number(x) : undefined);
    const weight = n(v.weight), height = n(v.height);
    const vs: VitalSigns = {
      id: genId("vit"), encounterId: encounter?.id ?? "sin-encuentro", patientId: patient.id, recordedAt: nowIso(),
      recordedBy: userName, recordedByRole: roleId, temperature: n(v.temperature), heartRate: n(v.heartRate),
      respiratoryRate: n(v.respiratoryRate), systolic: n(v.systolic), diastolic: n(v.diastolic), spo2: n(v.spo2),
      oxygenSupport: v.oxygenSupport, painScale: n(v.painScale), glucose: n(v.glucose), weight, height,
      bmi: weight && height ? Number((weight / Math.pow(height / 100, 2)).toFixed(1)) : undefined,
      neuroStatus: v.neuroStatus, comments: v.comments || undefined,
    };
    addVitals(vs);
    addToast({ title: "Signos vitales registrados", variant: "success" });
    setV({ ...EMPTY_VITALS });
  };

  const saveNote = () => {
    if (!patient) { addToast({ title: "Seleccione un paciente", variant: "warning" }); return; }
    addNote({
      id: genId("note"), encounterId: encounter?.id ?? "sin-encuentro", patientId: patient.id, type: "nursing",
      title: "Nota de enfermería", status: "signed", author: userName, authorRole: roleId, createdAt: nowIso(), signedAt: nowIso(),
      sections: { "Nota de enfermería": note.nursingNote, "Plan de cuidado": note.carePlan, "Educación al paciente": note.education, Observaciones: note.observations },
    });
    addToast({ title: "Nota de enfermería guardada", variant: "success" });
    setNote({ nursingNote: "", carePlan: "", observations: "", education: "" });
  };

  const taskCols: Column<NursingTask>[] = [
    { key: "type", header: "Tarea", render: (t) => <div><div className="font-medium text-ink-900">{t.type}</div><div className="text-2xs text-ink-400">{t.description}</div></div> },
    { key: "patient", header: "Paciente", render: (t) => <span className="text-2xs">{name(t.patientId)}</span> },
    { key: "priority", header: "Prioridad", render: (t) => <Badge tone={priorityMeta(t.priority).tone}>{priorityMeta(t.priority).label}</Badge> },
    { key: "due", header: "Vence", render: (t) => <span className="text-2xs text-ink-400">{formatDateTime(t.due)}</span> },
    { key: "status", header: "Estado", render: (t) => <Badge tone={taskStatusMeta(t.status).tone}>{taskStatusMeta(t.status).label}</Badge> },
    { key: "actions", header: "", align: "right", render: (t) => (
      <div className="flex justify-end gap-1.5">
        {t.status !== "done" && <Button size="sm" variant="outline" onClick={() => setNursingTaskStatus(t.id, "in-progress")} data-testid={`task-start-${t.id}`}>Iniciar</Button>}
        {t.status !== "done" && <Button size="sm" onClick={() => { setNursingTaskStatus(t.id, "done"); addToast({ title: "Tarea realizada", variant: "success" }); }} data-testid={`task-done-${t.id}`}>Realizar</Button>}
      </div>
    ) },
  ];

  return (
    <PageContainer>
      <PageHeader title="Estación de enfermería" description="Tareas, registro de signos vitales y notas de enfermería." icon={<Activity className="h-5 w-5" />} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Tareas pendientes" value={data.nursingTasks.filter((t) => t.status === "pending").length} tone="amber" />
        <Stat label="Vencidas" value={data.nursingTasks.filter((t) => t.status === "overdue").length} tone="red" />
        <Stat label="En curso" value={data.nursingTasks.filter((t) => t.status === "in-progress").length} tone="blue" />
        <Stat label="Realizadas" value={data.nursingTasks.filter((t) => t.status === "done").length} tone="green" />
      </div>

      <Tabs defaultTab={defaultTab} tabs={[
        { key: "tasks", label: "Tareas", content: <DataTable columns={taskCols} rows={data.nursingTasks} getRowId={(t) => t.id} testId="nursing-tasks-table" rowTestId={(t) => `nursing-task-${t.id}`} /> },
        { key: "vitals", label: "Signos vitales", content: (
          <div className="space-y-4">
            <SelectedPatientBanner requirement="registrar signos vitales" />
            <Section title="Registrar signos vitales" testId="section-vitals-entry" actions={<Button size="sm" onClick={saveVitals} data-testid="button-save-vitals"><Save className="h-4 w-4" /> Guardar</Button>}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <TextField id="nv-temp" name="temperature" testId="field-vital-temperature" label="Temp (°C)" section="Signos vitales" inputMode="decimal" value={v.temperature} onChange={(x) => updV("temperature", x)} />
                <TextField id="nv-hr" name="heartRate" testId="field-vital-heart-rate" label="FC (lpm)" section="Signos vitales" inputMode="numeric" value={v.heartRate} onChange={(x) => updV("heartRate", x)} />
                <TextField id="nv-rr" name="respiratoryRate" testId="field-vital-respiratory-rate" label="FR (rpm)" section="Signos vitales" inputMode="numeric" value={v.respiratoryRate} onChange={(x) => updV("respiratoryRate", x)} />
                <TextField id="nv-spo2" name="spo2" testId="field-vital-oxygen-saturation" label="SatO₂ (%)" section="Signos vitales" inputMode="numeric" value={v.spo2} onChange={(x) => updV("spo2", x)} />
                <TextField id="nv-sys" name="systolic" testId="field-vital-blood-pressure-systolic" label="TA sistólica" section="Signos vitales" inputMode="numeric" value={v.systolic} onChange={(x) => updV("systolic", x)} />
                <TextField id="nv-dia" name="diastolic" testId="field-vital-blood-pressure-diastolic" label="TA diastólica" section="Signos vitales" inputMode="numeric" value={v.diastolic} onChange={(x) => updV("diastolic", x)} />
                <SelectField id="nv-o2" name="oxygenSupport" testId="field-vital-oxygen-support" label="Soporte O₂" section="Signos vitales" value={v.oxygenSupport} onChange={(x) => updV("oxygenSupport", x)} options={["Ambiente", "Cánula nasal 2L", "Venturi 35%", "Máscara reservorio", "Ventilación mecánica"]} />
                <TextField id="nv-pain" name="painScale" testId="field-vital-pain-scale" label="Dolor (0-10)" section="Signos vitales" inputMode="numeric" value={v.painScale} onChange={(x) => updV("painScale", x)} />
                <TextField id="nv-glu" name="glucose" testId="field-vital-glucose" label="Glucometría" section="Signos vitales" inputMode="numeric" value={v.glucose} onChange={(x) => updV("glucose", x)} />
                <TextField id="nv-weight" name="weight" testId="field-vital-weight" label="Peso (kg)" section="Signos vitales" inputMode="decimal" value={v.weight} onChange={(x) => updV("weight", x)} />
                <TextField id="nv-height" name="height" testId="field-vital-height" label="Talla (cm)" section="Signos vitales" inputMode="numeric" value={v.height} onChange={(x) => updV("height", x)} />
                <SelectField id="nv-neuro" name="neuroStatus" testId="field-vital-neuro" label="Estado neurológico" section="Signos vitales" value={v.neuroStatus} onChange={(x) => updV("neuroStatus", x)} options={["Alerta", "Somnoliento", "Confuso", "Estuporoso"]} />
              </div>
              <div className="mt-3"><TextAreaField id="nv-comments" name="comments" testId="field-vital-comments" label="Comentarios" section="Signos vitales" rows={2} value={v.comments} onChange={(x) => updV("comments", x)} /></div>
            </Section>

            <Section title="Últimos signos vitales" testId="section-recent-vitals">
              {!patient ? <p className="text-sm text-ink-400">Seleccione un paciente.</p> : patientVitals.length === 0 ? <p className="text-sm text-ink-400">Sin registros.</p> : (
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-2xs uppercase text-ink-400"><th className="py-1">Hora</th><th>T°</th><th>FC</th><th>FR</th><th>TA</th><th>SatO₂</th><th>Dolor</th></tr></thead>
                  <tbody>{patientVitals.map((x) => <tr key={x.id} className="border-t border-ink-100"><td className="py-1.5 text-2xs text-ink-400">{formatDateTime(x.recordedAt)}</td><td>{x.temperature ?? "—"}</td><td>{x.heartRate ?? "—"}</td><td>{x.respiratoryRate ?? "—"}</td><td>{x.systolic ?? "—"}/{x.diastolic ?? "—"}</td><td>{x.spo2 ?? "—"}</td><td>{x.painScale ?? "—"}</td></tr>)}</tbody>
                </table>
              )}
            </Section>
          </div>
        ) },
        { key: "notes", label: "Notas", content: (
          <div className="space-y-4">
            <SelectedPatientBanner requirement="registrar notas de enfermería" />
            <Section title="Nota de enfermería" testId="section-nursing-note" actions={<Button size="sm" onClick={saveNote} data-testid="button-save-nursing-note"><Save className="h-4 w-4" /> Guardar nota</Button>}>
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <TextField id="nn-temp" name="temperature" testId="field-vital-temperature" label="Temp (°C)" section="Nota enfermería" inputMode="decimal" value={v.temperature} onChange={(x) => updV("temperature", x)} />
                  <TextField id="nn-pain" name="painScale" testId="field-vital-pain-scale" label="Dolor (0-10)" section="Nota enfermería" inputMode="numeric" value={v.painScale} onChange={(x) => updV("painScale", x)} />
                </div>
                <TextAreaField id="nn-note" name="nursingNote" testId="field-nursing-note" label="Nota de enfermería" section="Nota enfermería" rows={4} value={note.nursingNote} onChange={(x) => updN("nursingNote", x)} />
                <TextAreaField id="nn-care" name="carePlan" testId="field-care-plan" label="Plan de cuidado" section="Nota enfermería" rows={3} value={note.carePlan} onChange={(x) => updN("carePlan", x)} help="Nota: 'Plan' aparece también en SOAP, egreso y cirugía (prueba de contexto)." />
                <TextAreaField id="nn-edu" name="education" testId="field-patient-education" label="Educación al paciente" section="Nota enfermería" rows={2} value={note.education} onChange={(x) => updN("education", x)} />
                <TextAreaField id="nn-obs" name="observations" testId="field-nursing-observations" label="Observaciones" section="Nota enfermería" rows={2} value={note.observations} onChange={(x) => updN("observations", x)} />
              </div>
            </Section>
          </div>
        ) },
      ]} />
    </PageContainer>
  );
}
