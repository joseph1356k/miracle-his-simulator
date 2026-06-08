"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, UserPlus } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Section, Stat } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextField, TextAreaField, SelectField, CheckboxField } from "@/components/ui/Field";
import { DataTable, type Column } from "@/components/ui/Table";
import { SelectedPatientBanner } from "@/components/clinical/SelectedPatientBanner";
import { useSelected } from "@/lib/hooks/useSelected";
import { useHospital } from "@/lib/store/useHospital";
import { useSession } from "@/lib/store/useSession";
import { useUI } from "@/lib/store/useUI";
import { genId } from "@/lib/utils/id";
import { nowIso, fullName, formatDateTime } from "@/lib/utils/format";
import { EPS_LIST, SPECIALTIES, WARDS } from "@/lib/data/catalogs";
import { encounterStatusMeta } from "@/lib/utils/status";
import type { Encounter, EncounterType } from "@/lib/types";

const TYPE_MAP: Record<string, EncounterType> = { urgencias: "emergency", ambulatorio: "outpatient", hospitalizacion: "inpatient", remision: "inpatient" };

export default function AdmissionsPage() {
  const { patient } = useSelected();
  const data = useHospital((s) => s.data);
  const addEncounter = useHospital((s) => s.addEncounter);
  const { userName } = useSession();
  const selectEncounter = useSession((s) => s.selectEncounter);
  const addToast = useUI((s) => s.addToast);
  const router = useRouter();

  const [f, setF] = useState({
    admissionType: "urgencias", reason: "", origin: "Demanda espontánea", referralInstitution: "", referralReason: "",
    eps: patient?.eps ?? EPS_LIST[0], plan: "", authorization: "", coverage: "POS / PBS", adminObs: "",
    specialty: SPECIALTIES[0], ward: WARDS[0], responsible: "", responsibleId: "",
  });
  const [checklist, setChecklist] = useState({ identity: false, insurance: false, consent: false, documents: false, bed: false });
  const upd = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  const recent = useMemo(() => [...data.encounters].sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1)).slice(0, 25), [data.encounters]);
  const name = (id: string) => { const p = data.patients.find((x) => x.id === id); return p ? fullName(p) : id; };

  const submit = () => {
    if (!patient) { addToast({ title: "Seleccione un paciente", variant: "warning" }); return; }
    const type = TYPE_MAP[f.admissionType];
    const enc: Encounter = {
      id: genId("enc"), patientId: patient.id, type, status: type === "outpatient" ? "scheduled" : type === "inpatient" ? "admitted" : "waiting",
      reason: f.reason || "Ingreso administrativo", startedAt: nowIso(), attendingPhysician: userName,
      specialty: type === "outpatient" ? f.specialty : undefined, ward: type === "inpatient" ? f.ward : undefined,
      bed: type === "inpatient" ? `${f.ward.split(" ")[0].slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 400)}` : undefined,
      location: type === "inpatient" ? f.ward : undefined, eps: f.eps, diagnoses: [],
    };
    addEncounter(enc);
    selectEncounter(enc.id);
    addToast({ title: "Ingreso registrado", description: `${f.admissionType} · ${fullName(patient)}`, variant: "success" });
    setF((s) => ({ ...s, reason: "", adminObs: "" }));
  };

  const cols: Column<Encounter>[] = [
    { key: "patient", header: "Paciente", render: (e) => <span className="font-medium text-ink-900">{name(e.patientId)}</span> },
    { key: "type", header: "Tipo", render: (e) => <Badge tone="blue">{e.type}</Badge> },
    { key: "reason", header: "Motivo", render: (e) => e.reason },
    { key: "start", header: "Ingreso", render: (e) => <span className="text-2xs text-ink-400">{formatDateTime(e.startedAt)}</span> },
    { key: "status", header: "Estado", render: (e) => <Badge tone={encounterStatusMeta(e.status).tone}>{encounterStatusMeta(e.status).label}</Badge> },
  ];

  return (
    <PageContainer>
      <PageHeader title="Admisiones / Registro" description="Creación de encuentros: urgencias, ambulatorio, hospitalización y remisión." icon={<ClipboardList className="h-5 w-5" />} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Ingresos hoy (demo)" value={data.encounters.filter((e) => Date.now() - new Date(e.startedAt).getTime() < 86400000).length} tone="blue" />
        <Stat label="Urgencias activas" value={data.encounters.filter((e) => e.type === "emergency").length} tone="amber" />
        <Stat label="Hospitalizados" value={data.encounters.filter((e) => e.type === "inpatient").length} tone="teal" />
        <Stat label="Citas ambulatorias" value={data.encounters.filter((e) => e.type === "outpatient").length} tone="green" />
      </div>

      <Tabs tabs={[
        { key: "new", label: "Nuevo ingreso", content: (
          <div className="space-y-4">
            <SelectedPatientBanner requirement="registrar el ingreso" />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <Section title="Datos del ingreso" testId="section-admission">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SelectField id="ad-type" name="admissionType" testId="field-admission-type" label="Tipo de ingreso" section="Ingreso" value={f.admissionType} onChange={(v) => upd("admissionType", v)} options={[{ value: "urgencias", label: "Urgencias" }, { value: "ambulatorio", label: "Ambulatorio" }, { value: "hospitalizacion", label: "Hospitalización" }, { value: "remision", label: "Remisión" }]} />
                    <SelectField id="ad-origin" name="origin" testId="field-admission-origin" label="Origen del paciente" section="Ingreso" value={f.origin} onChange={(v) => upd("origin", v)} options={["Demanda espontánea", "Remitido", "Ambulancia", "Traslado interno"]} />
                    <TextField id="ad-reason" name="reason" testId="field-admission-reason" label="Motivo de consulta / ingreso" section="Ingreso" value={f.reason} onChange={(v) => upd("reason", v)} containerClassName="sm:col-span-2" />
                    <SelectField id="ad-spec" name="specialty" testId="field-admission-specialty" label="Especialidad" section="Ingreso" value={f.specialty} onChange={(v) => upd("specialty", v)} options={SPECIALTIES} />
                    <SelectField id="ad-ward" name="ward" testId="field-admission-ward" label="Servicio / piso" section="Ingreso" value={f.ward} onChange={(v) => upd("ward", v)} options={WARDS} />
                  </div>
                </Section>

                <Section title="Remisión" testId="section-referral-info">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextField id="ad-rinst" name="referralInstitution" testId="field-referral-institution" label="Institución remitente" section="Remisión" value={f.referralInstitution} onChange={(v) => upd("referralInstitution", v)} />
                    <TextField id="ad-rreason" name="referralReason" testId="field-referral-reason-admin" label="Motivo de remisión" section="Remisión" value={f.referralReason} onChange={(v) => upd("referralReason", v)} />
                  </div>
                </Section>

                <Section title="Aseguramiento y pago" testId="section-admission-insurance">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SelectField id="ad-eps" name="eps" testId="field-admission-eps" label="Aseguradora / EPS" section="Aseguramiento" value={f.eps} onChange={(v) => upd("eps", v)} options={EPS_LIST} />
                    <TextField id="ad-plan" name="plan" testId="field-admission-plan" label="Plan" section="Aseguramiento" value={f.plan} onChange={(v) => upd("plan", v)} />
                    <TextField id="ad-auth" name="authorization" testId="field-admission-authorization" label="Número de autorización" section="Aseguramiento" value={f.authorization} onChange={(v) => upd("authorization", v)} />
                    <SelectField id="ad-cov" name="coverage" testId="field-admission-coverage" label="Cobertura / pago" section="Aseguramiento" value={f.coverage} onChange={(v) => upd("coverage", v)} options={["POS / PBS", "No POS", "Particular", "SOAT", "ARL"]} />
                    <TextField id="ad-resp" name="responsible" testId="field-responsible-party" label="Responsable / acudiente" section="Aseguramiento" value={f.responsible} onChange={(v) => upd("responsible", v)} />
                    <TextField id="ad-respid" name="responsibleId" testId="field-responsible-id" label="Documento del responsable" section="Aseguramiento" value={f.responsibleId} onChange={(v) => upd("responsibleId", v)} />
                    <TextAreaField id="ad-obs" name="adminObs" testId="field-admin-observations" label="Observaciones administrativas" section="Aseguramiento" rows={2} value={f.adminObs} onChange={(v) => upd("adminObs", v)} containerClassName="sm:col-span-2" />
                  </div>
                </Section>
              </div>

              <Section title="Checklist de admisión" testId="section-admission-checklist" actions={<Button size="sm" onClick={submit} data-testid="button-create-admission"><UserPlus className="h-4 w-4" /> Registrar</Button>}>
                <div className="space-y-2">
                  <CheckboxField id="ck-identity" name="identity" testId="field-checklist-identity" label="Identidad verificada" section="Checklist" checked={checklist.identity} onChange={(v) => setChecklist((c) => ({ ...c, identity: v }))} />
                  <CheckboxField id="ck-insurance" name="insurance" testId="field-checklist-insurance" label="Aseguramiento validado" section="Checklist" checked={checklist.insurance} onChange={(v) => setChecklist((c) => ({ ...c, insurance: v }))} />
                  <CheckboxField id="ck-consent" name="consent" testId="field-checklist-consent" label="Consentimiento informado" section="Checklist" checked={checklist.consent} onChange={(v) => setChecklist((c) => ({ ...c, consent: v }))} />
                  <CheckboxField id="ck-docs" name="documents" testId="field-checklist-documents" label="Documentos cargados" section="Checklist" checked={checklist.documents} onChange={(v) => setChecklist((c) => ({ ...c, documents: v }))} />
                  <CheckboxField id="ck-bed" name="bed" testId="field-checklist-bed" label="Cama solicitada" section="Checklist" checked={checklist.bed} onChange={(v) => setChecklist((c) => ({ ...c, bed: v }))} />
                </div>
              </Section>
            </div>
          </div>
        ) },
        { key: "recent", label: "Ingresos recientes", content: <DataTable columns={cols} rows={recent} getRowId={(e) => e.id} testId="admissions-recent-table" onRowClick={(e) => { selectEncounter(e.id); router.push(`/patients/${e.patientId}`); }} /> },
      ]} />
    </PageContainer>
  );
}
