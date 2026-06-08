"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Stethoscope, Save, ClipboardList, FileSignature } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Section } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextField, TextAreaField, SelectField } from "@/components/ui/Field";
import { DiagnosisPicker } from "@/components/clinical/DiagnosisPicker";
import { useHospital } from "@/lib/store/useHospital";
import { useSession } from "@/lib/store/useSession";
import { useUI } from "@/lib/store/useUI";
import { useSaveShortcut } from "@/lib/hooks/useSaveShortcut";
import { genId } from "@/lib/utils/id";
import { nowIso, ageFromBirthDate, fullName } from "@/lib/utils/format";

export default function EmergencyEncounterPage() {
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

  const save = (sign: boolean) => {
    if (!encounter || !patient) return;
    addNote({
      id: genId("note"), encounterId: encounter.id, patientId: patient.id, type: "emergency",
      title: "Nota de urgencias", status: sign ? "signed" : "draft", author: userName, authorRole: roleId,
      createdAt: nowIso(), signedAt: sign ? nowIso() : undefined,
      sections: {
        "Motivo de consulta": f.chiefComplaint ?? "", "Enfermedad actual": f.presentIllness ?? "",
        "Revisión por sistemas": f.reviewSystems ?? "", "Antecedentes personales": f.pastMedical ?? "",
        "Antecedentes quirúrgicos": f.surgical ?? "", "Antecedentes familiares": f.family ?? "",
        "Antecedentes tóxicos": f.toxic ?? "", "Medicamentos habituales": f.homeMeds ?? "",
        Alergias: f.allergies ?? "", "Examen físico general": f.examGeneral ?? "",
        "Examen cardiovascular": f.examCardio ?? "", "Examen respiratorio": f.examResp ?? "",
        "Examen abdominal": f.examAbdomen ?? "", "Examen neurológico": f.examNeuro ?? "",
        "Impresión diagnóstica": f.impression ?? "", Plan: f.plan ?? "", Conducta: f.conduct ?? "",
        Recomendaciones: f.recommendations ?? "", Incapacidad: f.incapacity ?? "", "Destino del paciente": f.destination ?? "",
      },
    });
    addToast({ title: sign ? "Nota firmada" : "Borrador guardado", variant: "success" });
    if (sign) router.push("/emergency");
  };

  useSaveShortcut(() => save(false));

  if (!encounter || !patient) return <PageContainer><p className="text-sm text-ink-500">Encuentro no encontrado.</p></PageContainer>;

  return (
    <PageContainer>
      <PageHeader
        title="Nota médica de urgencias"
        description={`${fullName(patient)} · ${ageFromBirthDate(patient.birthDate)} años · ${encounter.reason}`}
        icon={<Stethoscope className="h-5 w-5" />}
        badge={<Badge tone="amber">{encounter.id}</Badge>}
        actions={
          <>
            <Button variant="outline" onClick={() => router.push("/orders/new")} data-testid="enc-create-orders"><ClipboardList className="h-4 w-4" /> Órdenes</Button>
            <Button variant="outline" onClick={() => save(false)} data-testid="button-save-note"><Save className="h-4 w-4" /> Guardar</Button>
            <Button onClick={() => save(true)} data-testid="button-sign-note"><FileSignature className="h-4 w-4" /> Firmar</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Section title="Anamnesis" testId="section-anamnesis">
          <div className="grid gap-3">
            <TextField id="em-cc" name="chiefComplaint" testId="field-chief-complaint" label="Motivo de consulta" section="Anamnesis" value={f.chiefComplaint ?? ""} onChange={(v) => upd("chiefComplaint", v)} required />
            <TextAreaField id="em-pi" name="presentIllness" testId="field-present-illness" label="Enfermedad actual" section="Anamnesis" rows={4} value={f.presentIllness ?? ""} onChange={(v) => upd("presentIllness", v)} />
            <TextAreaField id="em-ros" name="reviewSystems" testId="field-review-of-systems" label="Revisión por sistemas" section="Anamnesis" rows={2} value={f.reviewSystems ?? ""} onChange={(v) => upd("reviewSystems", v)} />
          </div>
        </Section>

        <Section title="Antecedentes" testId="section-history">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextAreaField id="em-pmh" name="pastMedical" testId="field-past-medical-history" label="Antecedentes personales" section="Antecedentes" rows={2} value={f.pastMedical ?? ""} onChange={(v) => upd("pastMedical", v)} />
            <TextAreaField id="em-surg" name="surgical" testId="field-surgical-history" label="Antecedentes quirúrgicos" section="Antecedentes" rows={2} value={f.surgical ?? ""} onChange={(v) => upd("surgical", v)} />
            <TextAreaField id="em-fam" name="family" testId="field-family-history" label="Antecedentes familiares" section="Antecedentes" rows={2} value={f.family ?? ""} onChange={(v) => upd("family", v)} />
            <TextAreaField id="em-tox" name="toxic" testId="field-toxic-history" label="Antecedentes tóxicos" section="Antecedentes" rows={2} value={f.toxic ?? ""} onChange={(v) => upd("toxic", v)} />
            <TextField id="em-hmeds" name="homeMeds" testId="field-home-medications" label="Medicamentos habituales" section="Antecedentes" value={f.homeMeds ?? ""} onChange={(v) => upd("homeMeds", v)} />
            <TextField id="em-alg" name="allergies" testId="field-allergies" label="Alergias" section="Antecedentes" value={f.allergies ?? ""} onChange={(v) => upd("allergies", v)} />
          </div>
        </Section>

        <Section title="Examen físico" testId="section-exam">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextAreaField id="em-exg" name="examGeneral" testId="field-exam-general" label="General" section="Examen físico" rows={2} value={f.examGeneral ?? ""} onChange={(v) => upd("examGeneral", v)} />
            <TextAreaField id="em-exc" name="examCardio" testId="field-exam-cardiovascular" label="Cardiovascular" section="Examen físico" rows={2} value={f.examCardio ?? ""} onChange={(v) => upd("examCardio", v)} />
            <TextAreaField id="em-exr" name="examResp" testId="field-exam-respiratory" label="Respiratorio" section="Examen físico" rows={2} value={f.examResp ?? ""} onChange={(v) => upd("examResp", v)} />
            <TextAreaField id="em-exa" name="examAbdomen" testId="field-exam-abdominal" label="Abdominal" section="Examen físico" rows={2} value={f.examAbdomen ?? ""} onChange={(v) => upd("examAbdomen", v)} />
            <TextAreaField id="em-exn" name="examNeuro" testId="field-exam-neurological" label="Neurológico" section="Examen físico" rows={2} value={f.examNeuro ?? ""} onChange={(v) => upd("examNeuro", v)} />
          </div>
        </Section>

        <Section title="Análisis y diagnósticos" testId="section-assessment">
          <div className="grid gap-3">
            <TextAreaField id="em-imp" name="impression" testId="field-diagnostic-impression" label="Impresión diagnóstica" section="Diagnósticos" rows={2} value={f.impression ?? ""} onChange={(v) => upd("impression", v)} />
            <DiagnosisPicker encounterId={encounter.id} patientId={patient.id} kind="sospecha" />
          </div>
        </Section>

        <Section title="Plan y conducta" testId="section-plan" className="xl:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextAreaField id="em-plan" name="plan" testId="field-plan" label="Plan" section="Plan" rows={3} value={f.plan ?? ""} onChange={(v) => upd("plan", v)} />
            <TextAreaField id="em-ord" name="ordersNote" testId="field-orders-note" label="Órdenes (texto)" section="Plan" rows={3} value={f.ordersNote ?? ""} onChange={(v) => upd("ordersNote", v)} help="Use el botón Órdenes para CPOE estructurado." />
            <TextField id="em-cond" name="conduct" testId="field-conduct" label="Conducta" section="Plan" value={f.conduct ?? ""} onChange={(v) => upd("conduct", v)} />
            <TextField id="em-rec" name="recommendations" testId="field-recommendations" label="Recomendaciones" section="Plan" value={f.recommendations ?? ""} onChange={(v) => upd("recommendations", v)} />
            <TextField id="em-inc" name="incapacity" testId="field-incapacity" label="Incapacidad" section="Plan" value={f.incapacity ?? ""} onChange={(v) => upd("incapacity", v)} placeholder="Días / observaciones" />
            <SelectField id="em-dest" name="destination" testId="field-destination" label="Destino del paciente" section="Plan" value={f.destination ?? ""} onChange={(v) => upd("destination", v)} placeholder="Seleccionar" options={["Alta a domicilio", "Observación", "Hospitalización", "UCI", "Remisión", "Cirugía"]} />
          </div>
        </Section>
      </div>
    </PageContainer>
  );
}
