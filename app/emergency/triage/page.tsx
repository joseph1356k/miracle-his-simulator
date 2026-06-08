"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Save } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Section } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextField, TextAreaField, SelectField } from "@/components/ui/Field";
import { SelectedPatientBanner } from "@/components/clinical/SelectedPatientBanner";
import { useSelected } from "@/lib/hooks/useSelected";
import { useHospital } from "@/lib/store/useHospital";
import { useSession } from "@/lib/store/useSession";
import { useUI } from "@/lib/store/useUI";
import { useSaveShortcut } from "@/lib/hooks/useSaveShortcut";
import { genId } from "@/lib/utils/id";
import { nowIso } from "@/lib/utils/format";
import { triageLevelMeta } from "@/lib/utils/status";

const EMPTY = {
  chiefComplaint: "", presentIllness: "", temperature: "", heartRate: "", respiratoryRate: "",
  systolic: "", diastolic: "", spo2: "", painScale: "", glucose: "", consciousness: "Alerta",
  priority: "3", history: "", allergies: "", medications: "", fallRisk: "Bajo", infectionRisk: "No",
  companion: "", observations: "",
};

export default function TriagePage() {
  const { patient, encounter } = useSelected();
  const addVitals = useHospital((s) => s.addVitals);
  const addNote = useHospital((s) => s.addNote);
  const { userName, roleId } = useSession();
  const addToast = useUI((s) => s.addToast);
  const router = useRouter();
  const [f, setF] = useState({ ...EMPTY });
  const upd = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  const save = () => {
    if (!patient) { addToast({ title: "Seleccione un paciente", variant: "warning" }); return; }
    const encId = encounter?.id ?? "sin-encuentro";
    const num = (v: string) => (v ? Number(v) : undefined);
    addVitals({
      id: genId("vit"), encounterId: encId, patientId: patient.id, recordedAt: nowIso(),
      recordedBy: userName, recordedByRole: roleId, temperature: num(f.temperature), heartRate: num(f.heartRate),
      respiratoryRate: num(f.respiratoryRate), systolic: num(f.systolic), diastolic: num(f.diastolic),
      spo2: num(f.spo2), painScale: num(f.painScale), glucose: num(f.glucose), comments: f.observations || undefined,
    });
    addNote({
      id: genId("note"), encounterId: encId, patientId: patient.id, type: "nursing", title: "Triage de enfermería",
      status: "signed", author: userName, authorRole: roleId, createdAt: nowIso(), signedAt: nowIso(),
      sections: {
        "Motivo de consulta": f.chiefComplaint, "Enfermedad actual": f.presentIllness,
        "Prioridad triage": triageLevelMeta(Number(f.priority)).label, "Nivel de conciencia": f.consciousness,
        Antecedentes: f.history, Alergias: f.allergies, "Medicamentos actuales": f.medications,
        "Riesgo de caída": f.fallRisk, "Riesgo infeccioso": f.infectionRisk, Acompañante: f.companion,
        "Observaciones de enfermería": f.observations,
      },
    });
    addToast({ title: "Triage registrado", description: triageLevelMeta(Number(f.priority)).label, variant: "success" });
    router.push("/emergency");
  };

  useSaveShortcut(save);

  return (
    <PageContainer>
      <PageHeader
        title="Triage de enfermería"
        description="Clasificación inicial del paciente en urgencias."
        icon={<ClipboardList className="h-5 w-5" />}
        badge={<Badge tone={triageLevelMeta(Number(f.priority)).tone}>{triageLevelMeta(Number(f.priority)).label}</Badge>}
        actions={<Button onClick={save} data-testid="button-save-triage"><Save className="h-4 w-4" /> Guardar triage</Button>}
      />
      <SelectedPatientBanner requirement="registrar el triage" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Section title="Motivo y enfermedad actual" testId="section-triage-reason">
            <div className="grid gap-3">
              <TextField id="tr-cc" name="chiefComplaint" testId="field-triage-chief-complaint" label="Motivo de consulta" section="Triage" value={f.chiefComplaint} onChange={(v) => upd("chiefComplaint", v)} required />
              <TextAreaField id="tr-pi" name="presentIllness" testId="field-triage-present-illness" label="Enfermedad actual breve" section="Triage" rows={3} value={f.presentIllness} onChange={(v) => upd("presentIllness", v)} />
            </div>
          </Section>

          <Section title="Signos vitales" testId="section-triage-vitals">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <TextField id="tr-temp" name="temperature" testId="field-vital-temperature" label="Temp (°C)" section="Signos vitales" inputMode="decimal" value={f.temperature} onChange={(v) => upd("temperature", v)} />
              <TextField id="tr-hr" name="heartRate" testId="field-vital-heart-rate" label="FC (lpm)" section="Signos vitales" inputMode="numeric" value={f.heartRate} onChange={(v) => upd("heartRate", v)} />
              <TextField id="tr-rr" name="respiratoryRate" testId="field-vital-respiratory-rate" label="FR (rpm)" section="Signos vitales" inputMode="numeric" value={f.respiratoryRate} onChange={(v) => upd("respiratoryRate", v)} />
              <TextField id="tr-spo2" name="spo2" testId="field-vital-oxygen-saturation" label="SatO₂ (%)" section="Signos vitales" inputMode="numeric" value={f.spo2} onChange={(v) => upd("spo2", v)} />
              <TextField id="tr-sys" name="systolic" testId="field-vital-blood-pressure-systolic" label="TA sistólica" section="Signos vitales" inputMode="numeric" value={f.systolic} onChange={(v) => upd("systolic", v)} />
              <TextField id="tr-dia" name="diastolic" testId="field-vital-blood-pressure-diastolic" label="TA diastólica" section="Signos vitales" inputMode="numeric" value={f.diastolic} onChange={(v) => upd("diastolic", v)} />
              <TextField id="tr-pain" name="painScale" testId="field-vital-pain-scale" label="Dolor (0-10)" section="Signos vitales" inputMode="numeric" value={f.painScale} onChange={(v) => upd("painScale", v)} />
              <TextField id="tr-glu" name="glucose" testId="field-vital-glucose" label="Glucometría" section="Signos vitales" inputMode="numeric" value={f.glucose} onChange={(v) => upd("glucose", v)} />
            </div>
          </Section>

          <Section title="Antecedentes y riesgos" testId="section-triage-history">
            <div className="grid gap-3 sm:grid-cols-2">
              <TextAreaField id="tr-hist" name="history" testId="field-triage-history" label="Antecedentes relevantes" section="Antecedentes" rows={2} value={f.history} onChange={(v) => upd("history", v)} />
              <TextField id="tr-alg" name="allergies" testId="field-allergies" label="Alergias" section="Antecedentes" value={f.allergies} onChange={(v) => upd("allergies", v)} />
              <TextField id="tr-meds" name="currentMedications" testId="field-triage-current-medications" label="Medicamentos actuales" section="Antecedentes" value={f.medications} onChange={(v) => upd("medications", v)} />
              <TextField id="tr-comp" name="companion" testId="field-triage-companion" label="Acompañante" section="Antecedentes" value={f.companion} onChange={(v) => upd("companion", v)} />
            </div>
          </Section>
        </div>

        <div className="space-y-4">
          <Section title="Clasificación" testId="section-triage-classification">
            <div className="grid gap-3">
              <SelectField id="tr-prio" name="priority" testId="field-triage-priority" label="Prioridad triage" section="Clasificación" value={f.priority} onChange={(v) => upd("priority", v)} options={[{ value: "1", label: "Nivel 1 · Resucitación" }, { value: "2", label: "Nivel 2 · Emergencia" }, { value: "3", label: "Nivel 3 · Urgencia" }, { value: "4", label: "Nivel 4 · Menor" }, { value: "5", label: "Nivel 5 · No urgente" }]} />
              <SelectField id="tr-cons" name="consciousness" testId="field-triage-consciousness" label="Nivel de conciencia" section="Clasificación" value={f.consciousness} onChange={(v) => upd("consciousness", v)} options={["Alerta", "Responde a voz", "Responde a dolor", "No responde"]} />
              <SelectField id="tr-fall" name="fallRisk" testId="field-triage-fall-risk" label="Riesgo de caída" section="Clasificación" value={f.fallRisk} onChange={(v) => upd("fallRisk", v)} options={["Bajo", "Moderado", "Alto"]} />
              <SelectField id="tr-inf" name="infectionRisk" testId="field-triage-infection-risk" label="Riesgo infeccioso" section="Clasificación" value={f.infectionRisk} onChange={(v) => upd("infectionRisk", v)} options={["No", "Sospecha", "Confirmado"]} />
            </div>
          </Section>

          <Section title="Observaciones" testId="section-triage-observations">
            <TextAreaField id="tr-obs" name="observations" testId="field-triage-observations" label="Observaciones de enfermería" section="Observaciones" rows={4} value={f.observations} onChange={(v) => upd("observations", v)} help="Nota: 'Observaciones' aparece en varios módulos (prueba de contexto Miracle)." />
          </Section>
        </div>
      </div>
    </PageContainer>
  );
}
