"use client";

import { useMemo, useRef, useState } from "react";
import { FileText, PenLine, Save, Signature, Sparkles, Stethoscope, ClipboardList } from "lucide-react";
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
import { nowIso, formatTime, fullName, ageFromBirthDate } from "@/lib/utils/format";
import { MIRACLE_SCENARIOS } from "@/lib/data/scenarios";
import type { NoteType, Order, OrderCategory } from "@/lib/types";

interface FieldDef { key: string; label: string; kind: "text" | "area"; rows?: number; placeholder?: string; help?: string; }
interface SectionDef { title: string; testId: string; cols?: number; fields: FieldDef[]; }

const STRUCTURED_SECTIONS: SectionDef[] = [
  {
    title: "Subjetivo", testId: "section-subjective", fields: [
      { key: "chief-complaint", label: "Motivo de consulta", kind: "area", rows: 2, placeholder: "Razón principal de la atención…", help: "Lo que el paciente refiere como motivo." },
      { key: "present-illness", label: "Enfermedad actual", kind: "area", rows: 4, placeholder: "Cronología, características, factores asociados…" },
    ],
  },
  {
    title: "Antecedentes", testId: "section-history", cols: 2, fields: [
      { key: "past-medical-history", label: "Antecedentes personales", kind: "area", rows: 2 },
      { key: "surgical-history", label: "Antecedentes quirúrgicos", kind: "area", rows: 2 },
      { key: "family-history", label: "Antecedentes familiares", kind: "area", rows: 2 },
      { key: "toxic-history", label: "Antecedentes tóxicos", kind: "area", rows: 2 },
      { key: "home-medications", label: "Medicamentos habituales", kind: "area", rows: 2, help: "Lo que el paciente toma en casa." },
      { key: "allergies", label: "Alergias", kind: "area", rows: 2, help: "Sustancia y reacción. Distinto de reacciones adversas." },
    ],
  },
  {
    title: "Objetivo — Revisión y examen", testId: "section-objective", fields: [
      { key: "review-of-systems", label: "Revisión por sistemas", kind: "area", rows: 3 },
      { key: "physical-exam", label: "Examen físico", kind: "area", rows: 3 },
    ],
  },
  {
    title: "Análisis", testId: "section-analysis", fields: [
      { key: "clinical-analysis", label: "Análisis clínico", kind: "area", rows: 3 },
    ],
  },
  {
    title: "Plan y educación", testId: "section-plan", cols: 2, fields: [
      { key: "plan", label: "Plan terapéutico", kind: "area", rows: 3 },
      { key: "patient-education", label: "Educación al paciente", kind: "area", rows: 2 },
      { key: "recommendations", label: "Recomendaciones", kind: "area", rows: 2 },
      { key: "alarm-signs", label: "Signos de alarma", kind: "area", rows: 2 },
      { key: "next-followup", label: "Próximo control", kind: "text" },
      { key: "incapacity", label: "Incapacidad / certificados", kind: "text" },
    ],
  },
  {
    title: "Órdenes y medicamentos", testId: "section-orders", cols: 2, fields: [
      { key: "lab-orders", label: "Órdenes de laboratorio", kind: "area", rows: 2, help: "Separe por comas para generar órdenes." },
      { key: "imaging-orders", label: "Órdenes de imágenes", kind: "area", rows: 2, help: "Separe por comas para generar órdenes." },
      { key: "prescribed-medications", label: "Medicamentos formulados", kind: "area", rows: 2 },
      { key: "order-indication", label: "Indicación / razón clínica", kind: "text" },
    ],
  },
];

const VITALS: { key: string; label: string }[] = [
  { key: "vital-blood-pressure-systolic", label: "TA sistólica" },
  { key: "vital-blood-pressure-diastolic", label: "TA diastólica" },
  { key: "vital-heart-rate", label: "Frecuencia cardíaca" },
  { key: "vital-respiratory-rate", label: "Frecuencia respiratoria" },
  { key: "vital-temperature", label: "Temperatura (°C)" },
  { key: "vital-oxygen-saturation", label: "SatO₂ (%)" },
  { key: "vital-pain-scale", label: "Escala de dolor" },
  { key: "vital-glucose", label: "Glucometría" },
];

const TEMPLATES: { value: NoteType; label: string }[] = [
  { value: "initial", label: "Nota médica inicial" },
  { value: "progress", label: "Evolución diaria" },
  { value: "emergency", label: "Nota de urgencias" },
  { value: "nursing", label: "Nota de enfermería" },
  { value: "interconsult", label: "Interconsulta" },
  { value: "procedure", label: "Procedimiento" },
  { value: "epicrisis", label: "Epicrisis" },
  { value: "certificate", label: "Certificado médico" },
  { value: "incapacity", label: "Incapacidad" },
];

const SUGGESTED_MAP = [
  { target: "chiefComplaint", testId: "field-chief-complaint" },
  { target: "presentIllness", testId: "field-present-illness" },
  { target: "pastMedicalHistory", testId: "field-past-medical-history" },
  { target: "medications", testId: "field-home-medications" },
  { target: "allergies", testId: "field-allergies" },
  { target: "vitalSigns", testId: "field-vital-blood-pressure-systolic" },
  { target: "diagnosisSuspicions", testId: "field-diagnosis" },
  { target: "labOrders", testId: "field-lab-orders" },
  { target: "imagingOrders", testId: "field-imaging-orders" },
  { target: "plan", testId: "field-plan" },
];

export default function DocumentationPage() {
  const { patient, encounter } = useSelected();
  const addNote = useHospital((s) => s.addNote);
  const updateNoteSection = useHospital((s) => s.updateNoteSection);
  const updateNoteBody = useHospital((s) => s.updateNoteBody);
  const signNote = useHospital((s) => s.signNote);
  const addOrder = useHospital((s) => s.addOrder);
  const { userName, roleId } = useSession();
  const addToast = useUI((s) => s.addToast);
  const setUnsaved = useUI((s) => s.setUnsavedChanges);

  const [mode, setMode] = useState<"structured" | "blank">("structured");
  const [template, setTemplate] = useState<NoteType>("initial");
  const [form, setForm] = useState<Record<string, string>>({});
  const [diagnosis, setDiagnosis] = useState("");
  const [transcript, setTranscript] = useState("");
  const [blank, setBlank] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const noteId = useRef<string | null>(null);
  const blankNoteId = useRef<string | null>(null);

  const update = (key: string, val: string) => { setForm((f) => ({ ...f, [key]: val })); };

  const buildSections = () => {
    const out: Record<string, string> = {};
    STRUCTURED_SECTIONS.forEach((s) => s.fields.forEach((f) => { if (form[f.key]) out[f.label] = form[f.key]; }));
    if (diagnosis) out["Diagnósticos"] = diagnosis;
    const vit = VITALS.filter((v) => form[v.key]).map((v) => `${v.label}: ${form[v.key]}`).join(" · ");
    if (vit) out["Signos vitales"] = vit;
    return out;
  };

  const saveStructured = (sign = false) => {
    if (!patient) { addToast({ title: "Seleccione un paciente", description: "Use Ctrl+K para buscar.", variant: "warning" }); return; }
    const sections = buildSections();
    if (!noteId.current) {
      const id = genId("note");
      noteId.current = id;
      addNote({
        id, encounterId: encounter?.id ?? "sin-encuentro", patientId: patient.id,
        type: "structured", title: TEMPLATES.find((t) => t.value === template)?.label ?? "Nota estructurada",
        status: sign ? "signed" : "draft", author: userName, authorRole: roleId,
        createdAt: nowIso(), signedAt: sign ? nowIso() : undefined, sections,
      });
    } else {
      Object.entries(sections).forEach(([k, v]) => updateNoteSection(noteId.current!, k, v));
      if (sign) signNote(noteId.current);
    }
    setSavedAt(nowIso());
    setUnsaved(false);
    addToast({ title: sign ? "Nota firmada" : "Borrador guardado", description: `${Object.keys(sections).length} secciones`, variant: "success" });
  };

  const saveBlank = (sign = false) => {
    if (!patient) { addToast({ title: "Seleccione un paciente", variant: "warning" }); return; }
    if (!blankNoteId.current) {
      const id = genId("note");
      blankNoteId.current = id;
      addNote({ id, encounterId: encounter?.id ?? "sin-encuentro", patientId: patient.id, type: template, title: TEMPLATES.find((t) => t.value === template)?.label ?? "Nota", status: sign ? "signed" : "draft", author: userName, authorRole: roleId, createdAt: nowIso(), signedAt: sign ? nowIso() : undefined, body: blank });
    } else {
      updateNoteBody(blankNoteId.current, blank);
      if (sign) signNote(blankNoteId.current);
    }
    setSavedAt(nowIso());
    setUnsaved(false);
    addToast({ title: sign ? "Nota firmada" : "Nota guardada", variant: "success" });
  };

  const generateOrders = () => {
    if (!patient) { addToast({ title: "Seleccione un paciente", variant: "warning" }); return; }
    const make = (text: string, category: OrderCategory) =>
      text.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean).map((name) => {
        const o: Order = {
          id: genId("ord"), encounterId: encounter?.id ?? "sin-encuentro", patientId: patient.id,
          category, name, priority: "rutina", indication: form["order-indication"] || undefined,
          status: "draft", orderedBy: userName, orderedByRole: roleId, createdAt: nowIso(), flags: [],
        };
        return o;
      });
    const created = [...make(form["lab-orders"] ?? "", "laboratory"), ...make(form["imaging-orders"] ?? "", "imaging")];
    created.forEach(addOrder);
    addToast({ title: `${created.length} órdenes creadas`, description: "Estado: borrador. Fírmelas en Órdenes médicas.", variant: created.length ? "success" : "info" });
  };

  const loadScenario = (id: string) => {
    const s = MIRACLE_SCENARIOS.find((x) => x.id === id);
    if (s) { setTranscript(s.transcript); addToast({ title: "Transcripción cargada", description: s.title, variant: "info" }); }
  };

  useSaveShortcut(() => (mode === "structured" ? saveStructured(false) : saveBlank(false)));

  const filledCount = useMemo(() => Object.values(form).filter((v) => v?.trim()).length + (diagnosis ? 1 : 0), [form, diagnosis]);

  return (
    <PageContainer>
      <PageHeader
        title="Centro de documentación clínica"
        description="Nota estructurada y nota en blanco. Núcleo de pruebas de mapeo de campos para Miracle."
        icon={<FileText className="h-5 w-5" />}
        badge={<Badge tone="blue">{filledCount} campos diligenciados</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-ink-200 p-0.5" role="tablist" aria-label="Modo de nota">
              <button role="tab" aria-selected={mode === "structured"} data-testid="mode-structured" onClick={() => setMode("structured")} className={`rounded px-3 py-1.5 text-xs font-medium ${mode === "structured" ? "bg-clinical-600 text-white" : "text-ink-600"}`}>Estructurada</button>
              <button role="tab" aria-selected={mode === "blank"} data-testid="mode-blank" onClick={() => setMode("blank")} className={`rounded px-3 py-1.5 text-xs font-medium ${mode === "blank" ? "bg-clinical-600 text-white" : "text-ink-600"}`}>En blanco</button>
            </div>
          </div>
        }
      />

      <SelectedPatientBanner />

      {mode === "structured" ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          {/* LEFT: transcript */}
          <div className="space-y-4 xl:col-span-3">
            <Section title="Transcripción / dictado" testId="section-transcript" actions={<Sparkles className="h-3.5 w-3.5 text-violet-500" />}>
              <SelectField id="doc-scenario" name="scenario" testId="field-scenario-loader" label="Cargar escenario Miracle" section="Transcripción" value="" onChange={loadScenario} options={MIRACLE_SCENARIOS.map((s) => ({ value: s.id, label: s.title }))} placeholder="Seleccionar transcripción…" />
              <div className="mt-3">
                <TextAreaField id="doc-transcript" name="transcript" testId="field-transcript" label="Texto dictado" section="Transcripción" rows={14} value={transcript} onChange={setTranscript} placeholder="Pegue aquí la conversación médico-paciente…" />
              </div>
            </Section>
          </div>

          {/* CENTER: structured fields */}
          <div className="space-y-4 xl:col-span-6">
            <Section title="Plantilla y firma" testId="section-template">
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectField id="doc-template" name="template" testId="field-note-template" label="Plantilla de nota" section="Plantilla" value={template} onChange={(v) => setTemplate(v as NoteType)} options={TEMPLATES} />
                <div className="flex items-end gap-2">
                  <Button variant="outline" onClick={() => saveStructured(false)} data-testid="button-save-clinical-note"><Save className="h-4 w-4" /> Guardar</Button>
                  <Button onClick={() => saveStructured(true)} data-testid="button-sign-clinical-note"><Signature className="h-4 w-4" /> Firmar</Button>
                </div>
              </div>
              <p className="mt-2 text-2xs text-ink-400" aria-live="polite">{savedAt ? `Guardado a las ${formatTime(savedAt)}` : "Cambios sin guardar"}</p>
            </Section>

            {STRUCTURED_SECTIONS.map((sec) => (
              <Section key={sec.testId} title={sec.title} testId={sec.testId}>
                <div className={sec.cols === 2 ? "grid gap-3 sm:grid-cols-2" : "space-y-3"}>
                  {sec.fields.map((f) =>
                    f.kind === "area" ? (
                      <TextAreaField key={f.key} id={`doc-${f.key}`} name={f.key} testId={`field-${f.key}`} label={f.label} section={sec.title} rows={f.rows} help={f.help} placeholder={f.placeholder} value={form[f.key] ?? ""} onChange={(v) => update(f.key, v)} />
                    ) : (
                      <TextField key={f.key} id={`doc-${f.key}`} name={f.key} testId={`field-${f.key}`} label={f.label} section={sec.title} help={f.help} placeholder={f.placeholder} value={form[f.key] ?? ""} onChange={(v) => update(f.key, v)} />
                    ),
                  )}
                </div>
                {sec.testId === "section-orders" && (
                  <Button variant="subtle" size="sm" className="mt-3" onClick={generateOrders} data-testid="button-generate-orders"><ClipboardList className="h-3.5 w-3.5" /> Generar órdenes desde texto</Button>
                )}
              </Section>
            ))}

            <Section title="Signos vitales" testId="section-vitals">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {VITALS.map((v) => (
                  <TextField key={v.key} id={`doc-${v.key}`} name={v.key} testId={`field-${v.key}`} label={v.label} section="Signos vitales" inputMode="decimal" value={form[v.key] ?? ""} onChange={(val) => update(v.key, val)} />
                ))}
              </div>
            </Section>

            <Section title="Diagnósticos" testId="section-diagnoses">
              <TextAreaField id="doc-diagnosis" name="diagnosis" testId="field-diagnosis" label="Impresión diagnóstica (CIE-10)" section="Diagnósticos" rows={2} placeholder="Ej: R07.4 Dolor torácico — a descartar SCA" value={diagnosis} onChange={setDiagnosis} />
            </Section>
          </div>

          {/* RIGHT: patient summary + suggested mapping */}
          <div className="space-y-4 xl:col-span-3">
            <Section title="Resumen del paciente" testId="section-patient-summary">
              {patient ? (
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-ink-900">{fullName(patient)}</p>
                  <p className="text-2xs text-ink-500">{ageFromBirthDate(patient.birthDate)} años · {patient.sex === "M" ? "Masculino" : "Femenino"} · {patient.bloodType}</p>
                  <div className="flex flex-wrap gap-1">
                    {patient.allergies.length ? patient.allergies.map((a) => <Badge key={a.id} tone="red">{a.substance}</Badge>) : <Badge tone="green">Sin alergias</Badge>}
                  </div>
                  {encounter && <p className="text-2xs text-ink-500">Encuentro: {encounter.type} · {encounter.reason}</p>}
                </div>
              ) : (
                <p className="text-sm text-ink-400">Sin paciente en contexto.</p>
              )}
            </Section>

            <Section title="Mapeo sugerido (Miracle)" testId="section-suggested-mapping" actions={<Stethoscope className="h-3.5 w-3.5 text-clinical-500" />}>
              <ul className="space-y-1.5 text-2xs">
                {SUGGESTED_MAP.map((row) => (
                  <li key={row.testId} className="flex items-center justify-between gap-2 rounded border border-ink-100 px-2 py-1">
                    <code className="text-clinical-700">{row.target}</code>
                    <code className="truncate text-ink-400">{row.testId}</code>
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Section title="Editor de nota libre" testId="section-blank-note" actions={<PenLine className="h-3.5 w-3.5 text-ink-400" />}>
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectField id="blank-template" name="template" testId="field-blank-template" label="Plantilla" section="Nota libre" value={template} onChange={(v) => setTemplate(v as NoteType)} options={TEMPLATES} />
              </div>
              <div className="mt-3">
                <TextAreaField id="blank-note" name="blankNote" testId="field-blank-note" label="Contenido de la nota" section="Nota libre" rows={18} value={blank} onChange={setBlank} placeholder="Escriba o dicte la nota clínica completa…" />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Button variant="outline" onClick={() => saveBlank(false)} data-testid="button-save-blank-note"><Save className="h-4 w-4" /> Guardar</Button>
                <Button onClick={() => saveBlank(true)} data-testid="button-sign-blank-note"><Signature className="h-4 w-4" /> Firmar</Button>
                <span className="text-2xs text-ink-400">{savedAt ? `Guardado ${formatTime(savedAt)}` : "Sin guardar"}</span>
              </div>
            </Section>
          </div>
          <div className="space-y-4">
            <Section title="Plantillas disponibles" testId="section-templates-list">
              <ul className="space-y-1 text-sm">
                {TEMPLATES.map((t) => (
                  <li key={t.value}>
                    <button onClick={() => setTemplate(t.value)} className={`w-full rounded-md border px-3 py-1.5 text-left ${template === t.value ? "border-clinical-300 bg-clinical-50 text-clinical-800" : "border-ink-200 text-ink-600 hover:bg-ink-50"}`}>{t.label}</button>
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
