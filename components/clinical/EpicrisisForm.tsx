"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileSignature } from "lucide-react";
import { Section } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextField, TextAreaField, SelectField, CheckboxField } from "@/components/ui/Field";
import { useHospital } from "@/lib/store/useHospital";
import { useSession } from "@/lib/store/useSession";
import { useUI } from "@/lib/store/useUI";
import { genId } from "@/lib/utils/id";
import { nowIso } from "@/lib/utils/format";
import type { Encounter, Patient } from "@/lib/types";

export function EpicrisisForm({ encounter, patient }: { encounter: Encounter; patient: Patient }) {
  const addNote = useHospital((s) => s.addNote);
  const setEncounterStatus = useHospital((s) => s.setEncounterStatus);
  const { userName, roleId } = useSession();
  const addToast = useUI((s) => s.addToast);
  const router = useRouter();

  const [f, setF] = useState<Record<string, string>>({ admissionReason: encounter.reason, admissionDx: encounter.admissionDiagnosis ?? "" });
  const upd = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));
  const [checks, setChecks] = useState({ billing: false, education: false, meds: false, appointments: false });

  const sign = () => {
    addNote({
      id: genId("note"), encounterId: encounter.id, patientId: patient.id, type: "epicrisis", title: "Epicrisis",
      status: "signed", author: userName, authorRole: roleId, createdAt: nowIso(), signedAt: nowIso(),
      sections: {
        "Motivo de ingreso": f.admissionReason ?? "", "Diagnóstico de ingreso": f.admissionDx ?? "",
        "Resumen de evolución": f.course ?? "", "Resultados relevantes": f.results ?? "", Procedimientos: f.procedures ?? "",
        "Diagnóstico de egreso": f.dischargeDx ?? "", "Condición al egreso": f.condition ?? "",
        "Medicamentos de salida": f.medications ?? "", Recomendaciones: f.recommendations ?? "",
        "Signos de alarma": f.alarmSigns ?? "", Controles: f.followUp ?? "", Incapacidad: f.incapacity ?? "",
        "Destino al egreso": f.destination ?? "",
      },
    });
    setEncounterStatus(encounter.id, "discharged");
    addToast({ title: "Epicrisis firmada · paciente egresado", variant: "success" });
    router.push("/discharge");
  };

  return (
    <div className="space-y-4">
      <Section title="Epicrisis" testId="section-epicrisis" actions={<Button size="sm" onClick={sign} data-testid="button-sign-epicrisis"><FileSignature className="h-4 w-4" /> Firmar y egresar</Button>}>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField id="ep-areason" name="admissionReason" testId="field-epicrisis-admission-reason" label="Motivo de ingreso" section="Epicrisis" value={f.admissionReason ?? ""} onChange={(v) => upd("admissionReason", v)} />
          <TextField id="ep-adx" name="admissionDx" testId="field-epicrisis-admission-diagnosis" label="Diagnóstico de ingreso" section="Epicrisis" value={f.admissionDx ?? ""} onChange={(v) => upd("admissionDx", v)} />
          <TextAreaField id="ep-course" name="course" testId="field-epicrisis-course" label="Resumen de evolución" section="Epicrisis" rows={3} value={f.course ?? ""} onChange={(v) => upd("course", v)} containerClassName="sm:col-span-2" />
          <TextAreaField id="ep-results" name="results" testId="field-epicrisis-results" label="Resultados relevantes" section="Epicrisis" rows={2} value={f.results ?? ""} onChange={(v) => upd("results", v)} />
          <TextAreaField id="ep-proc" name="procedures" testId="field-epicrisis-procedures" label="Procedimientos" section="Epicrisis" rows={2} value={f.procedures ?? ""} onChange={(v) => upd("procedures", v)} />
          <TextField id="ep-ddx" name="dischargeDx" testId="field-epicrisis-discharge-diagnosis" label="Diagnóstico de egreso" section="Epicrisis" value={f.dischargeDx ?? ""} onChange={(v) => upd("dischargeDx", v)} />
          <SelectField id="ep-cond" name="condition" testId="field-epicrisis-condition" label="Condición al egreso" section="Epicrisis" value={f.condition ?? ""} onChange={(v) => upd("condition", v)} placeholder="Seleccionar" options={["Mejorado", "Estable", "Sin cambios", "Remitido", "Fallecido"]} />
          <TextAreaField id="ep-meds" name="medications" testId="field-epicrisis-medications" label="Medicamentos de salida" section="Epicrisis" rows={2} value={f.medications ?? ""} onChange={(v) => upd("medications", v)} />
          <TextAreaField id="ep-recs" name="recommendations" testId="field-epicrisis-recommendations" label="Recomendaciones" section="Epicrisis" rows={2} value={f.recommendations ?? ""} onChange={(v) => upd("recommendations", v)} />
          <TextAreaField id="ep-alarm" name="alarmSigns" testId="field-epicrisis-alarm-signs" label="Signos de alarma" section="Epicrisis" rows={2} value={f.alarmSigns ?? ""} onChange={(v) => upd("alarmSigns", v)} />
          <TextField id="ep-fu" name="followUp" testId="field-epicrisis-followup" label="Controles" section="Epicrisis" value={f.followUp ?? ""} onChange={(v) => upd("followUp", v)} />
          <TextField id="ep-inc" name="incapacity" testId="field-epicrisis-incapacity" label="Incapacidad" section="Epicrisis" value={f.incapacity ?? ""} onChange={(v) => upd("incapacity", v)} />
          <SelectField id="ep-dest" name="destination" testId="field-discharge-destination" label="Destino al egreso" section="Epicrisis" value={f.destination ?? ""} onChange={(v) => upd("destination", v)} placeholder="Seleccionar" options={["Domicilio", "Remisión a otra institución", "Hospitalización domiciliaria", "Cuidado paliativo"]} />
        </div>
      </Section>

      <Section title="Checklist de egreso" testId="section-discharge-checklist">
        <div className="grid gap-2 sm:grid-cols-2">
          <CheckboxField id="dc-billing" name="billing" testId="field-checklist-billing" label="Paz y salvo de facturación" section="Egreso" checked={checks.billing} onChange={(v) => setChecks((c) => ({ ...c, billing: v }))} />
          <CheckboxField id="dc-edu" name="education" testId="field-checklist-education" label="Educación al paciente" section="Egreso" checked={checks.education} onChange={(v) => setChecks((c) => ({ ...c, education: v }))} />
          <CheckboxField id="dc-meds" name="meds" testId="field-checklist-discharge-meds" label="Fórmula de salida entregada" section="Egreso" checked={checks.meds} onChange={(v) => setChecks((c) => ({ ...c, meds: v }))} />
          <CheckboxField id="dc-appt" name="appointments" testId="field-checklist-appointments" label="Citas de control agendadas" section="Egreso" checked={checks.appointments} onChange={(v) => setChecks((c) => ({ ...c, appointments: v }))} />
        </div>
      </Section>
    </div>
  );
}
