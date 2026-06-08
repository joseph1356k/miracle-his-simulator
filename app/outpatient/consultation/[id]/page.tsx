"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Stethoscope, FileSignature, ClipboardList, Pill } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Section } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextField, TextAreaField } from "@/components/ui/Field";
import { DiagnosisPicker } from "@/components/clinical/DiagnosisPicker";
import { useHospital } from "@/lib/store/useHospital";
import { useSession } from "@/lib/store/useSession";
import { useUI } from "@/lib/store/useUI";
import { useSaveShortcut } from "@/lib/hooks/useSaveShortcut";
import { genId } from "@/lib/utils/id";
import { nowIso, ageFromBirthDate, fullName } from "@/lib/utils/format";

export default function ConsultationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const data = useHospital((s) => s.data);
  const addNote = useHospital((s) => s.addNote);
  const { userName, roleId } = useSession();
  const selectPatient = useSession((s) => s.selectPatient);
  const selectEncounter = useSession((s) => s.selectEncounter);
  const addToast = useUI((s) => s.addToast);

  const encounter = data.encounters.find((e) => e.id === params.id);
  const patient = data.patients.find((p) => p.id === encounter?.patientId);
  useEffect(() => { if (encounter) { selectPatient(encounter.patientId); selectEncounter(encounter.id); } }, [encounter, selectPatient, selectEncounter]);

  const [f, setF] = useState<Record<string, string>>({});
  const upd = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  const sign = () => {
    if (!encounter || !patient) return;
    addNote({
      id: genId("note"), encounterId: encounter.id, patientId: patient.id, type: "progress", title: `Consulta ${encounter.specialty ?? ""}`.trim(),
      status: "signed", author: userName, authorRole: roleId, createdAt: nowIso(), signedAt: nowIso(),
      sections: {
        "Motivo de consulta": f.chiefComplaint ?? "", "Enfermedad actual": f.presentIllness ?? "", Antecedentes: f.history ?? "",
        "Examen físico": f.exam ?? "", Análisis: f.assessment ?? "", Plan: f.plan ?? "",
        Medicamentos: f.medications ?? "", "Órdenes": [f.labOrders, f.imagingOrders].filter(Boolean).join(" | "),
        Incapacidad: f.incapacityDays ? `${f.incapacityDays} días — ${f.incapacityDx ?? ""}` : "", Certificado: f.certificate ?? "",
        Seguimiento: f.followup ?? "", "Próximo control": f.nextControl ?? "",
      },
    });
    addToast({ title: "Consulta firmada", variant: "success" });
    router.push("/outpatient");
  };

  useSaveShortcut(sign);

  if (!encounter || !patient) return <PageContainer><p className="text-sm text-ink-500">Consulta no encontrada.</p></PageContainer>;

  return (
    <PageContainer>
      <PageHeader
        title="Nota de consulta (SOAP)"
        description={`${fullName(patient)} · ${ageFromBirthDate(patient.birthDate)} años · ${encounter.specialty ?? "Consulta externa"}`}
        icon={<Stethoscope className="h-5 w-5" />}
        badge={<Badge tone="blue">{encounter.specialty}</Badge>}
        actions={<Button onClick={sign} data-testid="button-sign-consultation"><FileSignature className="h-4 w-4" /> Firmar</Button>}
      />

      <Tabs tabs={[
        { key: "s", label: "Subjetivo", testId: "tab-subjetivo", content: (
          <Section title="Subjetivo" testId="section-subjective">
            <div className="grid gap-3">
              <TextField id="cn-cc" name="chiefComplaint" testId="field-chief-complaint" label="Motivo de consulta" section="Subjetivo" value={f.chiefComplaint ?? ""} onChange={(v) => upd("chiefComplaint", v)} required />
              <TextAreaField id="cn-pi" name="presentIllness" testId="field-present-illness" label="Enfermedad actual" section="Subjetivo" rows={4} value={f.presentIllness ?? ""} onChange={(v) => upd("presentIllness", v)} />
              <TextAreaField id="cn-hist" name="history" testId="field-past-medical-history" label="Antecedentes" section="Subjetivo" rows={3} value={f.history ?? ""} onChange={(v) => upd("history", v)} />
            </div>
          </Section>
        ) },
        { key: "o", label: "Objetivo", testId: "tab-objetivo", content: (
          <Section title="Objetivo" testId="section-objective">
            <div className="grid gap-3 sm:grid-cols-3">
              <TextField id="cn-ta" name="bp" testId="field-vital-blood-pressure-systolic" label="TA sistólica" section="Objetivo" inputMode="numeric" value={f.bp ?? ""} onChange={(v) => upd("bp", v)} />
              <TextField id="cn-hr" name="hr" testId="field-vital-heart-rate" label="FC" section="Objetivo" inputMode="numeric" value={f.hr ?? ""} onChange={(v) => upd("hr", v)} />
              <TextField id="cn-temp" name="temp" testId="field-vital-temperature" label="Temperatura" section="Objetivo" inputMode="decimal" value={f.temp ?? ""} onChange={(v) => upd("temp", v)} />
            </div>
            <div className="mt-3"><TextAreaField id="cn-exam" name="exam" testId="field-exam-general" label="Examen físico" section="Objetivo" rows={4} value={f.exam ?? ""} onChange={(v) => upd("exam", v)} /></div>
          </Section>
        ) },
        { key: "a", label: "Análisis", testId: "tab-analisis", content: (
          <Section title="Análisis" testId="section-assessment"><TextAreaField id="cn-assess" name="assessment" testId="field-assessment" label="Análisis clínico" section="Análisis" rows={5} value={f.assessment ?? ""} onChange={(v) => upd("assessment", v)} /></Section>
        ) },
        { key: "p", label: "Plan", testId: "tab-plan", content: (
          <Section title="Plan" testId="section-plan"><TextAreaField id="cn-plan" name="plan" testId="field-plan" label="Plan terapéutico" section="Plan" rows={5} value={f.plan ?? ""} onChange={(v) => upd("plan", v)} /></Section>
        ) },
        { key: "dx", label: "Diagnósticos", testId: "tab-diagnoses", content: (
          <Section title="Diagnósticos" testId="section-diagnoses"><DiagnosisPicker encounterId={encounter.id} patientId={patient.id} kind="principal" /></Section>
        ) },
        { key: "ord", label: "Órdenes", testId: "tab-orders", content: (
          <Section title="Órdenes" testId="section-orders" actions={<Button size="sm" variant="outline" onClick={() => router.push("/orders/new")}><ClipboardList className="h-4 w-4" /> CPOE</Button>}>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextAreaField id="cn-labs" name="labOrders" testId="field-lab-orders" label="Laboratorios" section="Órdenes" rows={3} value={f.labOrders ?? ""} onChange={(v) => upd("labOrders", v)} />
              <TextAreaField id="cn-imgs" name="imagingOrders" testId="field-imaging-orders" label="Imágenes" section="Órdenes" rows={3} value={f.imagingOrders ?? ""} onChange={(v) => upd("imagingOrders", v)} />
            </div>
          </Section>
        ) },
        { key: "med", label: "Medicamentos", testId: "tab-medications", content: (
          <Section title="Medicamentos" testId="section-medications" actions={<Button size="sm" variant="outline" onClick={() => router.push("/medications")}><Pill className="h-4 w-4" /> Conciliación</Button>}>
            <TextAreaField id="cn-meds" name="prescribedMedications" testId="field-prescribed-medications" label="Medicamentos formulados hoy" section="Medicamentos" rows={4} value={f.medications ?? ""} onChange={(v) => upd("medications", v)} help="Distinto de medicamentos en casa (prueba de contexto Miracle)." />
          </Section>
        ) },
        { key: "inc", label: "Incapacidad / certificados", testId: "tab-incapacity", content: (
          <Section title="Incapacidad y certificados" testId="section-incapacity">
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField id="cn-incd" name="incapacityDays" testId="field-incapacity-days" label="Días de incapacidad" section="Incapacidad" inputMode="numeric" value={f.incapacityDays ?? ""} onChange={(v) => upd("incapacityDays", v)} />
              <TextField id="cn-incdx" name="incapacityDx" testId="field-incapacity-diagnosis" label="Diagnóstico de incapacidad" section="Incapacidad" value={f.incapacityDx ?? ""} onChange={(v) => upd("incapacityDx", v)} />
              <TextAreaField id="cn-cert" name="certificate" testId="field-medical-certificate" label="Certificado médico" section="Incapacidad" rows={3} value={f.certificate ?? ""} onChange={(v) => upd("certificate", v)} containerClassName="sm:col-span-2" />
            </div>
          </Section>
        ) },
        { key: "fu", label: "Seguimiento", testId: "tab-followup", content: (
          <Section title="Seguimiento" testId="section-followup">
            <div className="grid gap-3 sm:grid-cols-2">
              <TextAreaField id="cn-fu" name="followup" testId="field-followup-plan" label="Plan de seguimiento" section="Seguimiento" rows={3} value={f.followup ?? ""} onChange={(v) => upd("followup", v)} />
              <TextField id="cn-next" name="nextControl" testId="field-next-control" label="Próximo control" section="Seguimiento" value={f.nextControl ?? ""} onChange={(v) => upd("nextControl", v)} placeholder="Ej: en 3 meses" />
            </div>
          </Section>
        ) },
      ]} />
    </PageContainer>
  );
}
