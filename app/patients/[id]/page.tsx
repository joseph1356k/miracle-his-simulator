"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { IdCard, Stethoscope, FileText, ShieldAlert, ClipboardList } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Section, Stat } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/Table";
import { TextField, SelectField, CheckboxField } from "@/components/ui/Field";
import { useHospital } from "@/lib/store/useHospital";
import { useSession } from "@/lib/store/useSession";
import { useUI } from "@/lib/store/useUI";
import { EPS_LIST } from "@/lib/data/catalogs";
import { ageFromBirthDate, formatDate, formatDateTime, fullName } from "@/lib/utils/format";
import type { Encounter } from "@/lib/types";

const ENCOUNTER_LABEL: Record<string, string> = { emergency: "Urgencias", outpatient: "Consulta externa", inpatient: "Hospitalización", icu: "UCI", surgery: "Cirugía" };
const ROUTE_BY_TYPE: Record<string, string> = { emergency: "/emergency/encounter/", outpatient: "/outpatient/consultation/", inpatient: "/inpatient/encounter/", icu: "/icu", surgery: "/surgery/case/" };

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const data = useHospital((s) => s.data);
  const pushAudit = useHospital((s) => s.pushAudit);
  const selectPatient = useSession((s) => s.selectPatient);
  const selectEncounter = useSession((s) => s.selectEncounter);
  const addToast = useUI((s) => s.addToast);

  const patient = data.patients.find((p) => p.id === params.id);

  useEffect(() => { if (patient) selectPatient(patient.id); }, [patient, selectPatient]);

  const [form, setForm] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState({ informed: false, habeas: false });
  useEffect(() => {
    if (!patient) return;
    setForm({
      documentType: patient.documentType, documentNumber: patient.documentNumber,
      firstName: patient.firstName, lastName: patient.lastName, birthDate: patient.birthDate,
      sex: patient.sex, gender: patient.gender ?? "", bloodType: patient.bloodType ?? "",
      phone: patient.phone, email: patient.email ?? "", address: patient.address,
      neighborhood: patient.neighborhood ?? "", city: patient.city, department: patient.department,
      country: patient.country, occupation: patient.occupation ?? "",
      emergencyName: patient.emergencyContact.name, emergencyRel: patient.emergencyContact.relationship,
      emergencyPhone: patient.emergencyContact.phone, eps: patient.eps, plan: patient.plan ?? "",
    });
    setConsent({ informed: patient.consent.informedConsent, habeas: patient.consent.habeasData });
  }, [patient]);

  const encounters = useMemo(() => data.encounters.filter((e) => e.patientId === params.id), [data.encounters, params.id]);
  const notes = useMemo(() => data.notes.filter((n) => n.patientId === params.id), [data.notes, params.id]);

  if (!patient) {
    return <PageContainer><p className="text-sm text-ink-500">Paciente no encontrado.</p></PageContainer>;
  }

  const upd = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const saveDemographics = () => {
    pushAudit({ action: "update", entity: "Patient", module: "patients", patientId: patient.id, newValue: "Datos demográficos actualizados (demo)" });
    addToast({ title: "Datos guardados", description: "Demografía actualizada (demo).", variant: "success" });
  };

  const openEncounter = (e: Encounter) => {
    selectEncounter(e.id);
    const base = ROUTE_BY_TYPE[e.type];
    router.push(base.endsWith("/") ? `${base}${e.id}` : base);
  };

  const encColumns: Column<Encounter>[] = [
    { key: "type", header: "Tipo", render: (e) => <Badge tone="blue">{ENCOUNTER_LABEL[e.type]}</Badge> },
    { key: "reason", header: "Motivo", render: (e) => e.reason },
    { key: "date", header: "Inicio", render: (e) => formatDateTime(e.startedAt) },
    { key: "loc", header: "Ubicación", render: (e) => e.bed ? `${e.ward} · ${e.bed}` : (e.specialty ?? "—") },
    { key: "status", header: "Estado", render: (e) => e.status },
    { key: "open", header: "", align: "right", render: (e) => <Button size="sm" variant="outline" onClick={() => openEncounter(e)} data-testid={`open-encounter-${e.id}`}>Abrir</Button> },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={fullName(patient)}
        description={`${ageFromBirthDate(patient.birthDate)} años · ${patient.documentType} ${patient.documentNumber} · HC ${patient.recordNumber}`}
        icon={<IdCard className="h-5 w-5" />}
        badge={patient.isolation !== "none" ? <Badge tone="purple">Aislamiento</Badge> : undefined}
        actions={<Button variant="outline" onClick={() => router.push("/documentation")} data-testid="patient-new-note"><FileText className="h-4 w-4" /> Nueva nota</Button>}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Encuentros" value={encounters.length} />
        <Stat label="Notas clínicas" value={notes.length} />
        <Stat label="Órdenes" value={data.orders.filter((o) => o.patientId === patient.id).length} />
        <Stat label="Laboratorios" value={data.labs.filter((l) => l.patientId === patient.id).length} />
      </div>

      <Tabs
        tabs={[
          {
            key: "summary", label: "Resumen", content: (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Section title="Identificación" testId="section-identity" className="lg:col-span-2">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-3">
                    <Info label="Sexo" value={patient.sex === "M" ? "Masculino" : "Femenino"} />
                    <Info label="Grupo sanguíneo" value={patient.bloodType} />
                    <Info label="Fecha nacimiento" value={formatDate(patient.birthDate)} />
                    <Info label="Teléfono" value={patient.phone} />
                    <Info label="Correo" value={patient.email ?? "—"} />
                    <Info label="Ocupación" value={patient.occupation ?? "—"} />
                    <Info label="Dirección" value={patient.address} />
                    <Info label="Barrio" value={patient.neighborhood ?? "—"} />
                    <Info label="Ciudad" value={`${patient.city}, ${patient.department}`} />
                    <Info label="EPS" value={patient.eps} />
                    <Info label="Plan" value={patient.plan ?? "—"} />
                    <Info label="Contacto emergencia" value={`${patient.emergencyContact.name} (${patient.emergencyContact.relationship})`} />
                  </div>
                </Section>
                <Section title="Alertas y banderas" testId="section-alerts">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {patient.allergies.length ? patient.allergies.map((a) => <Badge key={a.id} tone="red">{a.substance} · {a.severity}</Badge>) : <Badge tone="green">Sin alergias conocidas</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {patient.riskFlags.map((r) => <Badge key={r} tone="amber">Riesgo: {r}</Badge>)}
                      {patient.codeStatus === "dnr" && <Badge tone="purple">No reanimar</Badge>}
                      {patient.isolation !== "none" && <Badge tone="purple">Aislamiento {patient.isolation}</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <Badge tone={patient.consent.informedConsent ? "green" : "amber"}>Consentimiento {patient.consent.informedConsent ? "firmado" : "pendiente"}</Badge>
                      <Badge tone={patient.consent.habeasData ? "green" : "amber"}>Habeas data {patient.consent.habeasData ? "ok" : "pendiente"}</Badge>
                    </div>
                    {patient.privacyFlags.map((f) => <p key={f} className="text-2xs text-ink-500">{f}</p>)}
                  </div>
                </Section>
              </div>
            ),
          },
          {
            key: "demographics", label: "Demografía", content: (
              <div className="space-y-4">
                <Section title="Datos del paciente" testId="section-demographics" actions={<Button size="sm" onClick={saveDemographics} data-testid="button-save-demographics">Guardar</Button>}>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <SelectField id="pt-docType" name="documentType" testId="field-document-type" label="Tipo de documento" section="Demografía" value={form.documentType ?? ""} onChange={(v) => upd("documentType", v)} options={["CC", "TI", "CE", "RC", "PA", "MS"]} />
                    <TextField id="pt-docNum" name="documentNumber" testId="field-document-number" label="Número de documento" section="Demografía" value={form.documentNumber ?? ""} onChange={(v) => upd("documentNumber", v)} />
                    <TextField id="pt-record" name="recordNumber" testId="field-record-number" label="Número de historia" section="Demografía" value={patient.recordNumber} onChange={() => {}} disabled />
                    <TextField id="pt-first" name="firstName" testId="field-first-name" label="Nombres" section="Demografía" value={form.firstName ?? ""} onChange={(v) => upd("firstName", v)} required />
                    <TextField id="pt-last" name="lastName" testId="field-last-name" label="Apellidos" section="Demografía" value={form.lastName ?? ""} onChange={(v) => upd("lastName", v)} required />
                    <TextField id="pt-birth" name="birthDate" testId="field-birth-date" label="Fecha de nacimiento" section="Demografía" type="date" value={form.birthDate ?? ""} onChange={(v) => upd("birthDate", v)} />
                    <SelectField id="pt-sex" name="sex" testId="field-sex" label="Sexo biológico" section="Demografía" value={form.sex ?? ""} onChange={(v) => upd("sex", v)} options={[{ value: "M", label: "Masculino" }, { value: "F", label: "Femenino" }, { value: "Other", label: "Otro" }]} />
                    <TextField id="pt-gender" name="gender" testId="field-gender" label="Género" section="Demografía" value={form.gender ?? ""} onChange={(v) => upd("gender", v)} />
                    <SelectField id="pt-blood" name="bloodType" testId="field-blood-type" label="Grupo sanguíneo" section="Demografía" value={form.bloodType ?? ""} onChange={(v) => upd("bloodType", v)} options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]} placeholder="Seleccionar" />
                    <TextField id="pt-phone" name="phone" testId="field-phone" label="Teléfono" section="Demografía" type="tel" value={form.phone ?? ""} onChange={(v) => upd("phone", v)} />
                    <TextField id="pt-email" name="email" testId="field-email" label="Correo" section="Demografía" type="email" value={form.email ?? ""} onChange={(v) => upd("email", v)} />
                    <TextField id="pt-occupation" name="occupation" testId="field-occupation" label="Ocupación" section="Demografía" value={form.occupation ?? ""} onChange={(v) => upd("occupation", v)} />
                    <TextField id="pt-address" name="address" testId="field-address" label="Dirección" section="Demografía" value={form.address ?? ""} onChange={(v) => upd("address", v)} />
                    <TextField id="pt-neighborhood" name="neighborhood" testId="field-neighborhood" label="Barrio" section="Demografía" value={form.neighborhood ?? ""} onChange={(v) => upd("neighborhood", v)} />
                    <TextField id="pt-city" name="city" testId="field-city" label="Ciudad" section="Demografía" value={form.city ?? ""} onChange={(v) => upd("city", v)} />
                    <TextField id="pt-dept" name="department" testId="field-department" label="Departamento" section="Demografía" value={form.department ?? ""} onChange={(v) => upd("department", v)} />
                    <TextField id="pt-country" name="country" testId="field-country" label="País" section="Demografía" value={form.country ?? ""} onChange={(v) => upd("country", v)} />
                  </div>
                </Section>

                <Section title="Aseguramiento y contacto" testId="section-insurance">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <SelectField id="pt-eps" name="eps" testId="field-eps" label="Aseguradora / EPS" section="Aseguramiento" value={form.eps ?? ""} onChange={(v) => upd("eps", v)} options={EPS_LIST} />
                    <TextField id="pt-plan" name="plan" testId="field-plan-name" label="Plan" section="Aseguramiento" value={form.plan ?? ""} onChange={(v) => upd("plan", v)} />
                    <TextField id="pt-emName" name="emergencyName" testId="field-emergency-contact" label="Contacto de emergencia" section="Aseguramiento" value={form.emergencyName ?? ""} onChange={(v) => upd("emergencyName", v)} />
                    <TextField id="pt-emRel" name="emergencyRel" testId="field-emergency-relationship" label="Parentesco" section="Aseguramiento" value={form.emergencyRel ?? ""} onChange={(v) => upd("emergencyRel", v)} />
                    <TextField id="pt-emPhone" name="emergencyPhone" testId="field-emergency-phone" label="Teléfono de emergencia" section="Aseguramiento" value={form.emergencyPhone ?? ""} onChange={(v) => upd("emergencyPhone", v)} />
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <CheckboxField id="pt-consent" name="informedConsent" testId="field-informed-consent" label="Consentimiento informado" section="Aseguramiento" description="Firmado por el paciente o acudiente." checked={consent.informed} onChange={(v) => setConsent((c) => ({ ...c, informed: v }))} />
                    <CheckboxField id="pt-habeas" name="habeasData" testId="field-habeas-data" label="Autorización de habeas data" section="Aseguramiento" description="Tratamiento de datos personales." checked={consent.habeas} onChange={(v) => setConsent((c) => ({ ...c, habeas: v }))} />
                  </div>
                </Section>
              </div>
            ),
          },
          {
            key: "encounters", label: "Encuentros", badge: <Badge tone="neutral">{encounters.length}</Badge>, content: (
              <DataTable columns={encColumns} rows={encounters} getRowId={(e) => e.id} testId="patient-encounters-table" empty="Sin encuentros." />
            ),
          },
          {
            key: "notes", label: "Historia clínica", badge: <Badge tone="neutral">{notes.length}</Badge>, content: (
              <div className="space-y-2">
                {notes.length === 0 && <p className="text-sm text-ink-400">Sin notas registradas.</p>}
                {notes.map((n) => (
                  <Section key={n.id} title={`${n.title} · ${formatDateTime(n.createdAt)}`} testId={`note-${n.id}`} actions={<Badge tone={n.status === "signed" ? "green" : "slate"}>{n.status === "signed" ? "Firmada" : "Borrador"}</Badge>}>
                    {n.sections ? (
                      <dl className="space-y-1.5 text-sm">
                        {Object.entries(n.sections).map(([k, v]) => (
                          <div key={k}><dt className="text-2xs font-semibold uppercase text-ink-400">{k}</dt><dd className="text-ink-700">{v}</dd></div>
                        ))}
                      </dl>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm text-ink-700">{n.body}</p>
                    )}
                  </Section>
                ))}
              </div>
            ),
          },
        ]}
      />
    </PageContainer>
  );
}

function Info({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-2xs font-medium uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="text-ink-800">{value ?? "—"}</dd>
    </div>
  );
}
