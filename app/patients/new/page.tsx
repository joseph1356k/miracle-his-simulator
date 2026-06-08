"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Save, Eraser, Stethoscope, ClipboardPlus, ShieldCheck } from "lucide-react";
import { PageContainer } from "@/components/app-shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TextField, TextAreaField, SelectField } from "@/components/ui/Field";
import { useHospital } from "@/lib/store/useHospital";
import { useSession } from "@/lib/store/useSession";
import { useUI } from "@/lib/store/useUI";
import { useSaveShortcut } from "@/lib/hooks/useSaveShortcut";
import { genId } from "@/lib/utils/id";
import { nowIso } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { EPS_LIST } from "@/lib/data/catalogs";
import type { Allergy, Encounter, Patient, VitalSigns } from "@/lib/types";

/* Large "EPS intake" visual style shared by every field on this screen. */
const BIG_INPUT = "h-12 rounded-xl px-4 text-base";
const BIG_AREA = "rounded-xl px-4 py-3 text-base";
const BIG_LABEL = "mb-1.5 text-2xs font-semibold uppercase tracking-wider text-ink-500";
const big = { className: BIG_INPUT, labelClassName: BIG_LABEL } as const;
const bigArea = { className: BIG_AREA, labelClassName: BIG_LABEL } as const;

const EMPTY = {
  recordNumber: "", documentType: "", documentNumber: "", coverageClass: "",
  firstName: "", lastName: "", birthDate: "", sex: "", bloodType: "",
  phone: "", email: "", city: "", department: "", address: "",
  eps: "", plan: "", channel: "", emergencyName: "", emergencyPhone: "", emergencyRel: "", language: "",
  reason: "", intakeNotes: "",
  temperature: "", heartRate: "", bloodPressure: "", spo2: "", respRate: "", pain: "", weight: "", height: "",
  priority: "", alarmSigns: "",
  visitType: "", symptomDays: "", location: "", presentIllness: "", history: "", allergies: "", currentMeds: "", reviewSystems: "",
  appearance: "", exam: "", riskFactors: "", clinicalSummary: "",
};

function parseAllergies(text: string): Allergy[] {
  const t = text.trim();
  if (!t || /\b(niega|ninguna|sin alergias)\b/i.test(t)) return [];
  return t.split(/[,;]/).map((s) => s.trim()).filter(Boolean).map((substance, i) => ({
    id: `alg-new-${i}`, substance, type: "medicamento", reaction: "", severity: "moderada",
  }));
}

export default function NewPatientPage() {
  const router = useRouter();
  const addPatient = useHospital((s) => s.addPatient);
  const addEncounter = useHospital((s) => s.addEncounter);
  const addVitals = useHospital((s) => s.addVitals);
  const addNote = useHospital((s) => s.addNote);
  const { userName, roleId } = useSession();
  const selectPatient = useSession((s) => s.selectPatient);
  const selectEncounter = useSession((s) => s.selectEncounter);
  const addToast = useUI((s) => s.addToast);

  const [f, setF] = useState({ ...EMPTY });
  const upd = (k: keyof typeof EMPTY, v: string) => setF((s) => ({ ...s, [k]: v }));
  const num = (v: string) => (v ? Number(v) : undefined);

  const register = (goToPatient = true) => {
    if (!f.firstName.trim() || !f.lastName.trim() || !f.documentNumber.trim()) {
      addToast({ title: "Faltan datos obligatorios", description: "Nombre, apellido y número de documento son requeridos.", variant: "warning" });
      return;
    }
    const id = genId("pat");
    const patient: Patient = {
      id,
      recordNumber: f.recordNumber.trim() || `MRN-2026-${String(Math.floor(Math.random() * 90000) + 10000)}`,
      documentType: (f.documentType || "CC") as Patient["documentType"],
      documentNumber: f.documentNumber.trim(),
      firstName: f.firstName.trim(),
      lastName: f.lastName.trim(),
      birthDate: f.birthDate || "1990-01-01",
      sex: (f.sex || "M") as Patient["sex"],
      gender: f.sex === "F" ? "Femenino" : f.sex === "Other" ? "Otro" : "Masculino",
      bloodType: (f.bloodType || undefined) as Patient["bloodType"],
      allergies: parseAllergies(f.allergies),
      eps: f.eps || "Particular",
      plan: [f.plan, f.coverageClass].filter(Boolean).join(" · ") || undefined,
      phone: f.phone,
      email: f.email || undefined,
      address: f.address,
      city: f.city || "Medellín",
      department: f.department || "Antioquia",
      country: "Colombia",
      occupation: undefined,
      emergencyContact: { name: f.emergencyName, relationship: f.emergencyRel || "—", phone: f.emergencyPhone },
      consent: { informedConsent: true, habeasData: true },
      privacyFlags: [],
      riskFlags: [],
      codeStatus: "full",
      isolation: "none",
      createdAt: nowIso(),
    };
    addPatient(patient);
    selectPatient(id);

    // If clinical intake data was entered, also create the first encounter.
    const hasVitals = !!(f.temperature || f.heartRate || f.bloodPressure || f.spo2);
    const hasNote = !!(f.reason || f.presentIllness || f.exam || f.clinicalSummary);
    if (hasVitals || hasNote) {
      const isEmergency = /urgenc|ambulan/i.test(f.channel);
      const enc: Encounter = {
        id: genId("enc"), patientId: id, type: isEmergency ? "emergency" : "outpatient",
        status: isEmergency ? "waiting" : "in-progress", reason: f.reason || "Registro de paciente nuevo",
        startedAt: nowIso(), attendingPhysician: userName, specialty: isEmergency ? undefined : "Medicina general",
        eps: patient.eps, diagnoses: [],
      };
      addEncounter(enc);
      selectEncounter(enc.id);
      if (hasVitals) {
        const [sys, dia] = (f.bloodPressure || "/").split("/");
        const weight = num(f.weight), height = num(f.height);
        const vs: VitalSigns = {
          id: genId("vit"), encounterId: enc.id, patientId: id, recordedAt: nowIso(), recordedBy: userName, recordedByRole: roleId,
          temperature: num(f.temperature), heartRate: num(f.heartRate), respiratoryRate: num(f.respRate),
          systolic: num(sys), diastolic: num(dia), spo2: num(f.spo2), painScale: num(f.pain),
          weight, height, bmi: weight && height ? Number((weight / Math.pow(height / 100, 2)).toFixed(1)) : undefined,
          comments: f.alarmSigns || undefined,
        };
        addVitals(vs);
      }
      if (hasNote) {
        addNote({
          id: genId("note"), encounterId: enc.id, patientId: id, type: "initial", title: "Nota de ingreso / registro",
          status: "signed", author: userName, authorRole: roleId, createdAt: nowIso(), signedAt: nowIso(),
          sections: {
            "Motivo de consulta": f.reason, "Notas de ingreso": f.intakeNotes, "Historia de la enfermedad actual": f.presentIllness,
            "Antecedentes relevantes": f.history, Alergias: f.allergies, "Medicamentos actuales": f.currentMeds,
            "Revisión por sistemas": f.reviewSystems, "Apariencia general": f.appearance, "Hallazgos del examen físico": f.exam,
            "Factores de riesgo": f.riskFactors, "Resumen clínico": f.clinicalSummary,
          },
        });
      }
    }

    addToast({ title: "Paciente registrado", description: `${patient.firstName} ${patient.lastName} · ${patient.recordNumber}`, variant: "success" });
    if (goToPatient) router.push(`/patients/${id}`);
    else setF({ ...EMPTY });
  };

  useSaveShortcut(() => register(true));

  return (
    <PageContainer className="max-w-[1320px]">
      {/* Hero header */}
      <div className="overflow-hidden rounded-2xl border border-clinical-200 bg-gradient-to-br from-clinical-600 to-clinical-800 p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Registro de nuevos pacientes</h1>
              <p className="mt-1 max-w-2xl text-sm text-clinical-100">
                Recepción institucional estilo cita de EPS. Diligencia identificación, datos administrativos,
                triage inicial y la valoración clínica. Los campos con <span className="font-semibold">*</span> son obligatorios.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start rounded-full bg-white/10 px-3 py-1.5 text-xs">
            <ShieldCheck className="h-4 w-4" /> Datos sintéticos de prueba
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <BigSection tag="Obligatorio" tone="amber" title="Identificación del paciente" description="Registra el núcleo de identidad y contacto para una recepción robusta." icon={<UserPlus className="h-5 w-5" />}>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <TextField {...big} id="reg-mrn" name="recordNumber" testId="field-reg-record-number" label="Número de historia clínica" section="Identificación" value={f.recordNumber} onChange={(v) => upd("recordNumber", v)} placeholder="MRN-2026-00124" />
            <SelectField {...big} id="reg-doctype" name="documentType" testId="field-reg-document-type" label="Tipo de documento" section="Identificación" value={f.documentType} onChange={(v) => upd("documentType", v)} placeholder="Seleccionar" options={[{ value: "CC", label: "Cédula de ciudadanía" }, { value: "TI", label: "Tarjeta de identidad" }, { value: "CE", label: "Cédula de extranjería" }, { value: "RC", label: "Registro civil" }, { value: "PA", label: "Pasaporte" }, { value: "MS", label: "Menor sin identificación" }]} />
            <TextField {...big} id="reg-docnum" name="documentNumber" testId="field-reg-document-number" label="Número de documento" section="Identificación" value={f.documentNumber} onChange={(v) => upd("documentNumber", v)} required inputMode="numeric" placeholder="1023456789" />
            <SelectField {...big} id="reg-coverage" name="coverageClass" testId="field-reg-coverage-class" label="Clase de cobertura" section="Identificación" value={f.coverageClass} onChange={(v) => upd("coverageClass", v)} placeholder="Seleccionar" options={["Contributivo", "Subsidiado", "Particular", "Medicina prepagada", "SOAT", "ARL"]} />
            <TextField {...big} id="reg-first" name="firstName" testId="field-reg-first-name" label="Nombre" section="Identificación" value={f.firstName} onChange={(v) => upd("firstName", v)} required placeholder="Valentina" />
            <TextField {...big} id="reg-last" name="lastName" testId="field-reg-last-name" label="Apellido" section="Identificación" value={f.lastName} onChange={(v) => upd("lastName", v)} required placeholder="Gómez Ruiz" />
            <TextField {...big} id="reg-birth" name="birthDate" testId="field-reg-birth-date" label="Fecha de nacimiento" section="Identificación" type="date" value={f.birthDate} onChange={(v) => upd("birthDate", v)} />
            <SelectField {...big} id="reg-sex" name="sex" testId="field-reg-sex" label="Sexo biológico" section="Identificación" value={f.sex} onChange={(v) => upd("sex", v)} placeholder="Seleccionar" options={[{ value: "M", label: "Masculino" }, { value: "F", label: "Femenino" }, { value: "Other", label: "Intersexual / otro" }]} />
            <TextField {...big} id="reg-phone" name="phone" testId="field-reg-phone" label="Teléfono móvil" section="Identificación" type="tel" value={f.phone} onChange={(v) => upd("phone", v)} placeholder="+57 300 555 1134" />
            <TextField {...big} id="reg-email" name="email" testId="field-reg-email" label="Correo electrónico" section="Identificación" type="email" value={f.email} onChange={(v) => upd("email", v)} placeholder="paciente@email.com" />
            <SelectField {...big} id="reg-blood" name="bloodType" testId="field-reg-blood-type" label="Grupo sanguíneo" section="Identificación" value={f.bloodType} onChange={(v) => upd("bloodType", v)} placeholder="Seleccionar" options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]} />
            <TextField {...big} id="reg-city" name="city" testId="field-reg-city" label="Ciudad" section="Identificación" value={f.city} onChange={(v) => upd("city", v)} placeholder="Bogotá" />
            <TextField {...big} id="reg-dept" name="department" testId="field-reg-department" label="Departamento" section="Identificación" value={f.department} onChange={(v) => upd("department", v)} placeholder="Cundinamarca" />
            <TextField {...big} id="reg-address" name="address" testId="field-reg-address" label="Dirección" section="Identificación" value={f.address} onChange={(v) => upd("address", v)} containerClassName="sm:col-span-2 lg:col-span-3" placeholder="Carrera 15 # 98-42, Bogotá" />
          </div>
        </BigSection>

        <BigSection tag="Administrativo" tone="blue" title="Administrativo y motivo de consulta" description="Amplía pagador, plan, contactos y contexto de atención." icon={<ClipboardPlus className="h-5 w-5" />}>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <SelectField {...big} id="reg-eps" name="eps" testId="field-reg-eps" label="Asegurador / pagador" section="Administrativo" value={f.eps} onChange={(v) => upd("eps", v)} placeholder="Seleccionar" options={EPS_LIST} />
            <TextField {...big} id="reg-plan" name="plan" testId="field-reg-plan" label="Plan / contrato" section="Administrativo" value={f.plan} onChange={(v) => upd("plan", v)} placeholder="Plan Empresarial 2204" />
            <SelectField {...big} id="reg-channel" name="channel" testId="field-reg-channel" label="Canal de ingreso" section="Administrativo" value={f.channel} onChange={(v) => upd("channel", v)} placeholder="Seleccionar" options={["Cita programada", "Demanda espontánea", "Remitido", "Ambulancia", "Urgencia"]} />
            <TextField {...big} id="reg-emname" name="emergencyName" testId="field-reg-emergency-contact" label="Contacto de emergencia" section="Administrativo" value={f.emergencyName} onChange={(v) => upd("emergencyName", v)} placeholder="Laura Ruiz" />
            <TextField {...big} id="reg-emphone" name="emergencyPhone" testId="field-reg-emergency-phone" label="Teléfono de emergencia" section="Administrativo" value={f.emergencyPhone} onChange={(v) => upd("emergencyPhone", v)} placeholder="+57 310 222 3311" />
            <TextField {...big} id="reg-emrel" name="emergencyRel" testId="field-reg-emergency-relationship" label="Parentesco" section="Administrativo" value={f.emergencyRel} onChange={(v) => upd("emergencyRel", v)} placeholder="Madre / Esposo(a)…" />
            <TextAreaField {...bigArea} id="reg-reason" name="reason" testId="field-chief-complaint" label="Motivo de consulta" section="Administrativo" rows={3} value={f.reason} onChange={(v) => upd("reason", v)} containerClassName="lg:col-span-3" placeholder="Paciente refiere 3 días de fiebre, dolor de garganta y fatiga." />
            <TextAreaField {...bigArea} id="reg-intake" name="intakeNotes" testId="field-reg-intake-notes" label="Notas de ingreso" section="Administrativo" rows={2} value={f.intakeNotes} onChange={(v) => upd("intakeNotes", v)} containerClassName="lg:col-span-3" placeholder="Consulta por síntomas respiratorios. Llegó caminando, sin acompañante, sin signos de alarma." />
          </div>
        </BigSection>

        <BigSection tag="Triage" tone="purple" title="Triage clínico inicial" description="Registra signos vitales y elementos de priorización antes de la valoración médica." icon={<Stethoscope className="h-5 w-5" />}>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <TextField {...big} id="reg-temp" name="temperature" testId="field-vital-temperature" label="Temperatura (°C)" section="Triage" inputMode="decimal" value={f.temperature} onChange={(v) => upd("temperature", v)} placeholder="38.2" />
            <TextField {...big} id="reg-hr" name="heartRate" testId="field-vital-heart-rate" label="Frecuencia cardíaca" section="Triage" inputMode="numeric" value={f.heartRate} onChange={(v) => upd("heartRate", v)} placeholder="96" />
            <TextField {...big} id="reg-bp" name="bloodPressure" testId="field-vital-blood-pressure" label="Presión arterial" section="Triage" value={f.bloodPressure} onChange={(v) => upd("bloodPressure", v)} placeholder="118/74" />
            <TextField {...big} id="reg-spo2" name="spo2" testId="field-vital-oxygen-saturation" label="SpO₂ (%)" section="Triage" inputMode="numeric" value={f.spo2} onChange={(v) => upd("spo2", v)} placeholder="98" />
            <TextField {...big} id="reg-rr" name="respRate" testId="field-vital-respiratory-rate" label="Frecuencia respiratoria" section="Triage" inputMode="numeric" value={f.respRate} onChange={(v) => upd("respRate", v)} placeholder="18" />
            <TextField {...big} id="reg-pain" name="pain" testId="field-vital-pain-scale" label="Dolor (0-10)" section="Triage" inputMode="numeric" value={f.pain} onChange={(v) => upd("pain", v)} placeholder="4" />
            <TextField {...big} id="reg-weight" name="weight" testId="field-vital-weight" label="Peso (kg)" section="Triage" inputMode="decimal" value={f.weight} onChange={(v) => upd("weight", v)} placeholder="68" />
            <TextField {...big} id="reg-height" name="height" testId="field-vital-height" label="Talla (cm)" section="Triage" inputMode="numeric" value={f.height} onChange={(v) => upd("height", v)} placeholder="166" />
            <SelectField {...big} id="reg-priority" name="priority" testId="field-triage-priority" label="Prioridad" section="Triage" value={f.priority} onChange={(v) => upd("priority", v)} placeholder="Seleccionar" options={[{ value: "1", label: "1 · Resucitación" }, { value: "2", label: "2 · Emergencia" }, { value: "3", label: "3 · Urgencia" }, { value: "4", label: "4 · Menor" }, { value: "5", label: "5 · No urgente" }]} containerClassName="lg:col-span-1" />
            <TextAreaField {...bigArea} id="reg-alarm" name="alarmSigns" testId="field-triage-observations" label="Signos de alarma / observaciones" section="Triage" rows={3} value={f.alarmSigns} onChange={(v) => upd("alarmSigns", v)} containerClassName="lg:col-span-4" placeholder="Sin estridor, sin cianosis, hidratación conservada, alerta y orientada." />
          </div>
        </BigSection>

        <BigSection tag="Anamnesis" tone="teal" title="Historia de la enfermedad actual" description="Documenta la cronología del cuadro, antecedentes y síntomas asociados." icon={<ClipboardPlus className="h-5 w-5" />}>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <SelectField {...big} id="reg-visit" name="visitType" testId="field-reg-visit-type" label="Tipo de visita" section="Anamnesis" value={f.visitType} onChange={(v) => upd("visitType", v)} placeholder="Seleccionar" options={["Primera vez", "Control", "Urgencia", "Seguimiento"]} />
            <TextField {...big} id="reg-days" name="symptomDays" testId="field-reg-symptom-days" label="Días con síntomas" section="Anamnesis" inputMode="numeric" value={f.symptomDays} onChange={(v) => upd("symptomDays", v)} placeholder="3" />
            <TextField {...big} id="reg-loc" name="location" testId="field-reg-location" label="Localización principal" section="Anamnesis" value={f.location} onChange={(v) => upd("location", v)} placeholder="Orofaringe" />
            <TextAreaField {...bigArea} id="reg-hpi" name="presentIllness" testId="field-present-illness" label="Historia de la enfermedad actual" section="Anamnesis" rows={4} value={f.presentIllness} onChange={(v) => upd("presentIllness", v)} containerClassName="lg:col-span-3" placeholder="Paciente con 3 días de fiebre, odinofagia y malestar general sin disnea ni dolor torácico." />
            <TextAreaField {...bigArea} id="reg-hist" name="history" testId="field-past-medical-history" label="Antecedentes relevantes" section="Anamnesis" rows={3} value={f.history} onChange={(v) => upd("history", v)} placeholder="Hipertensión controlada con losartán." />
            <TextAreaField {...bigArea} id="reg-alg" name="allergies" testId="field-allergies" label="Alergias" section="Anamnesis" rows={3} value={f.allergies} onChange={(v) => upd("allergies", v)} placeholder="Niega alergias medicamentosas conocidas." />
            <TextAreaField {...bigArea} id="reg-meds" name="currentMeds" testId="field-reg-current-medications" label="Medicamentos actuales" section="Anamnesis" rows={3} value={f.currentMeds} onChange={(v) => upd("currentMeds", v)} placeholder="Losartán 50 mg/día." />
            <TextAreaField {...bigArea} id="reg-ros" name="reviewSystems" testId="field-review-of-systems" label="Revisión por sistemas" section="Anamnesis" rows={3} value={f.reviewSystems} onChange={(v) => upd("reviewSystems", v)} containerClassName="lg:col-span-3" placeholder="Positivo para fiebre y odinofagia. Negativo para vómito, diarrea, disnea y dolor torácico." />
          </div>
        </BigSection>

        <BigSection tag="Examen" tone="green" title="Examen físico y banderas clínicas" description="Captura observación general, hallazgos y factores que afectan la conducta clínica." icon={<Stethoscope className="h-5 w-5" />}>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <TextAreaField {...bigArea} id="reg-appear" name="appearance" testId="field-exam-general" label="Apariencia general" section="Examen" rows={3} value={f.appearance} onChange={(v) => upd("appearance", v)} placeholder="Alerta, hidratada, sin dificultad respiratoria." />
            <TextAreaField {...bigArea} id="reg-exam" name="exam" testId="field-reg-exam-findings" label="Hallazgos del examen físico" section="Examen" rows={3} value={f.exam} onChange={(v) => upd("exam", v)} placeholder="Faringe eritematosa sin exudado, campos pulmonares limpios." />
            <TextAreaField {...bigArea} id="reg-risk" name="riskFactors" testId="field-reg-risk-factors" label="Factores de riesgo" section="Examen" rows={3} value={f.riskFactors} onChange={(v) => upd("riskFactors", v)} placeholder="Sin inmunosupresión, sin embarazo, sin comorbilidad descompensada." />
            <TextAreaField {...bigArea} id="reg-summary" name="clinicalSummary" testId="field-diagnostic-impression" label="Resumen clínico del médico" section="Examen" rows={3} value={f.clinicalSummary} onChange={(v) => upd("clinicalSummary", v)} containerClassName="lg:col-span-3" placeholder="Cuadro compatible con infección respiratoria alta no complicada." />
          </div>
        </BigSection>
      </div>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 z-10 -mx-4 mt-2 border-t border-ink-200 bg-white/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-ink-500">Los campos con <span className="font-semibold text-rose-500">*</span> son obligatorios. <kbd className="rounded border border-ink-300 px-1">Ctrl/Cmd + S</kbd> registra.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" className="rounded-full" onClick={() => setF({ ...EMPTY })} data-testid="button-clear-registration"><Eraser className="h-4 w-4" /> Limpiar</Button>
            <Button variant="outline" className="rounded-full" onClick={() => register(false)} data-testid="button-save-and-new"><Save className="h-4 w-4" /> Registrar y nuevo</Button>
            <Button size="lg" className="rounded-full px-6" onClick={() => register(true)} data-testid="button-register-patient"><UserPlus className="h-4 w-4" /> Registrar paciente</Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

const TONE: Record<string, string> = {
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  blue: "border-clinical-200 bg-clinical-50 text-clinical-700",
  purple: "border-violet-200 bg-violet-50 text-violet-700",
  teal: "border-teal-200 bg-teal-50 text-teal-700",
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

function BigSection({ tag, tone, title, description, icon, children }: { tag: string; tone: keyof typeof TONE | string; title: string; description: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-ink-200 bg-white p-6 shadow-sm sm:p-7" aria-label={title} data-testid={`reg-section-${tag.toLowerCase()}`}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {icon && <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-clinical-50 text-clinical-600">{icon}</div>}
          <div>
            <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
            <p className="mt-1 max-w-3xl text-sm text-ink-500">{description}</p>
          </div>
        </div>
        <span className={cn("shrink-0 rounded-full border px-3 py-1 text-2xs font-semibold uppercase tracking-wider", TONE[tone] ?? TONE.blue)}>{tag}</span>
      </div>
      {children}
    </section>
  );
}
