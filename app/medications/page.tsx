"use client";

import { useMemo, useState } from "react";
import { Pill, Plus, Check, X } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Section } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextField, TextAreaField, SelectField } from "@/components/ui/Field";
import { SelectedPatientBanner } from "@/components/clinical/SelectedPatientBanner";
import { useSelected } from "@/lib/hooks/useSelected";
import { useHospital } from "@/lib/store/useHospital";
import { useSession } from "@/lib/store/useSession";
import { useUI } from "@/lib/store/useUI";
import { genId } from "@/lib/utils/id";
import { nowIso, formatTime } from "@/lib/utils/format";
import { MEDICATION_CATALOG, ORDER_ROUTES, FREQUENCIES } from "@/lib/data/catalogs";
import { marStatusMeta, medValidationMeta } from "@/lib/utils/status";
import type { MedicationOrder } from "@/lib/types";

const SOURCE_LABEL: Record<string, string> = { home: "En casa", active: "Hospitalario", discharge: "De egreso" };

export default function MedicationsPage() {
  const { patient, encounter } = useSelected();
  const data = useHospital((s) => s.data);
  const addMedication = useHospital((s) => s.addMedication);
  const administerMar = useHospital((s) => s.administerMar);
  const omitMar = useHospital((s) => s.omitMar);
  const setMedValidation = useHospital((s) => s.setMedValidation);
  const { userName, roleId } = useSession();
  const addToast = useUI((s) => s.addToast);

  const patientMeds = useMemo(() => data.medications.filter((mo) => mo.patientId === patient?.id), [data.medications, patient]);
  const validationQueue = useMemo(() => data.medications.filter((mo) => mo.validationStatus === "pending"), [data.medications]);

  const [home, setHome] = useState("");
  const [active, setActive] = useState("");
  const [recon, setRecon] = useState("");
  const [med, setMed] = useState({ name: "", dose: "", unit: "mg", route: "Oral", frequency: "Cada 8 horas", duration: "", indication: "" });

  const upd = (k: string, v: string) => setMed((s) => ({ ...s, [k]: v }));

  const addMed = () => {
    if (!patient) { addToast({ title: "Seleccione un paciente", variant: "warning" }); return; }
    if (!med.name) { addToast({ title: "Ingrese el medicamento", variant: "warning" }); return; }
    const id = genId("med");
    const mo: MedicationOrder = {
      id, encounterId: encounter?.id ?? "sin-encuentro", patientId: patient.id,
      medicationName: med.name, dose: med.dose || "1", unit: med.unit, route: med.route, frequency: med.frequency,
      duration: med.duration || undefined, indication: med.indication || undefined, startDate: nowIso(),
      source: "active", prescriber: userName, validationStatus: "pending", flags: [],
      schedule: [{ id: `${id}-0`, time: nowIso(), status: "pending" }],
    };
    addMedication(mo);
    addToast({ title: "Medicamento agregado", description: `${med.name} ${med.dose}${med.unit}`, variant: "success" });
    setMed({ name: "", dose: "", unit: "mg", route: "Oral", frequency: "Cada 8 horas", duration: "", indication: "" });
  };

  return (
    <PageContainer>
      <PageHeader title="Medicamentos · eMAR · Conciliación" description="Conciliación de medicamentos, registro de administración (eMAR) y cola de validación de farmacia." icon={<Pill className="h-5 w-5" />} />
      <SelectedPatientBanner requirement="gestionar medicamentos" />

      <Tabs tabs={[
        {
          key: "reconciliation", label: "Conciliación", content: (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <Section title="Conciliación de medicamentos" testId="section-reconciliation">
                  <div className="grid gap-3">
                    <TextAreaField id="med-home" name="homeMedications" testId="field-home-medications" label="Medicamentos en casa" section="Conciliación" rows={3} value={home} onChange={setHome} placeholder="Losartán 50 mg/día, Atorvastatina 40 mg noche…" help="Lo que el paciente toma en casa (distinto de los hospitalarios)." />
                    <TextAreaField id="med-active" name="activeMedications" testId="field-active-medications" label="Medicamentos hospitalarios" section="Conciliación" rows={3} value={active} onChange={setActive} placeholder="Enoxaparina, Omeprazol…" />
                    <TextAreaField id="med-recon" name="reconciliationNote" testId="field-reconciliation-note" label="Nota de conciliación" section="Conciliación" rows={3} value={recon} onChange={setRecon} placeholder="Decisiones: suspender, continuar, ajustar…" />
                  </div>
                  <Button className="mt-3" size="sm" variant="outline" onClick={() => addToast({ title: "Conciliación guardada (demo)", variant: "success" })} data-testid="button-save-reconciliation">Guardar conciliación</Button>
                </Section>

                <Section title="Medicamentos del paciente" testId="section-patient-meds">
                  {patientMeds.length === 0 ? <p className="text-sm text-ink-400">Sin medicamentos para este paciente.</p> : (
                    <div className="space-y-1.5">
                      {patientMeds.map((mo) => (
                        <div key={mo.id} className="flex items-center gap-2 rounded-md border border-ink-200 px-3 py-2 text-sm">
                          <Badge tone="slate">{SOURCE_LABEL[mo.source]}</Badge>
                          <span className="flex-1"><span className="font-medium text-ink-800">{mo.medicationName}</span> <span className="text-2xs text-ink-500">{mo.dose}{mo.unit} · {mo.route} · {mo.frequency}</span></span>
                          {mo.flags.map((f) => <Badge key={f} tone="red">{f}</Badge>)}
                          <Badge tone={medValidationMeta(mo.validationStatus).tone}>{medValidationMeta(mo.validationStatus).label}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>
              </div>

              <Section title="Formular medicamento" testId="section-add-med">
                <div className="grid gap-3">
                  <SelectField id="med-name" name="medicationName" testId="field-medication-name" label="Medicamento" section="Formular" value={med.name} onChange={(v) => upd("name", v)} options={MEDICATION_CATALOG.map((x) => x.name)} placeholder="Seleccionar" />
                  <div className="grid grid-cols-2 gap-3">
                    <TextField id="med-dose" name="dose" testId="field-medication-dose" label="Dosis" section="Formular" value={med.dose} onChange={(v) => upd("dose", v)} inputMode="decimal" />
                    <SelectField id="med-unit" name="unit" testId="field-medication-unit" label="Unidad" section="Formular" value={med.unit} onChange={(v) => upd("unit", v)} options={["mg", "g", "mL", "UI", "mcg"]} />
                  </div>
                  <SelectField id="med-route" name="route" testId="field-medication-route" label="Vía" section="Formular" value={med.route} onChange={(v) => upd("route", v)} options={ORDER_ROUTES} />
                  <SelectField id="med-freq" name="frequency" testId="field-medication-frequency" label="Frecuencia" section="Formular" value={med.frequency} onChange={(v) => upd("frequency", v)} options={FREQUENCIES} />
                  <TextField id="med-duration" name="duration" testId="field-medication-duration" label="Duración" section="Formular" value={med.duration} onChange={(v) => upd("duration", v)} />
                  <TextField id="med-indication" name="indication" testId="field-medication-indication" label="Indicación" section="Formular" value={med.indication} onChange={(v) => upd("indication", v)} />
                  <Button onClick={addMed} data-testid="button-add-medication"><Plus className="h-4 w-4" /> Formular</Button>
                </div>
              </Section>
            </div>
          ),
        },
        {
          key: "emar", label: "eMAR", content: (
            <Section title="Registro de administración de medicamentos (eMAR)" testId="section-emar">
              {!patient ? <p className="text-sm text-ink-400">Seleccione un paciente para ver el eMAR.</p> : patientMeds.length === 0 ? <p className="text-sm text-ink-400">Sin medicamentos activos.</p> : (
                <div className="space-y-3">
                  {patientMeds.map((mo) => (
                    <div key={mo.id} className="rounded-md border border-ink-200 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-ink-800">{mo.medicationName} <span className="text-2xs text-ink-500">{mo.dose}{mo.unit} · {mo.route} · {mo.frequency}</span></span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {mo.schedule.map((e) => (
                          <div key={e.id} data-testid={`mar-${e.id}`} className="flex items-center gap-1.5 rounded-md border border-ink-200 bg-ink-50 px-2 py-1.5">
                            <span className="text-2xs text-ink-500">{formatTime(e.time)}</span>
                            <Badge tone={marStatusMeta(e.status).tone}>{marStatusMeta(e.status).label}</Badge>
                            {e.status === "pending" && (
                              <>
                                <button onClick={() => { administerMar(mo.id, e.id); addToast({ title: "Dosis administrada", variant: "success" }); }} aria-label="Administrar" data-testid={`mar-administer-${e.id}`} className="rounded bg-emerald-100 p-1 text-emerald-700 hover:bg-emerald-200"><Check className="h-3 w-3" /></button>
                                <button onClick={() => { omitMar(mo.id, e.id, "Omitido por enfermería (demo)"); addToast({ title: "Dosis omitida", variant: "warning" }); }} aria-label="Omitir" data-testid={`mar-omit-${e.id}`} className="rounded bg-rose-100 p-1 text-rose-700 hover:bg-rose-200"><X className="h-3 w-3" /></button>
                              </>
                            )}
                            {e.administeredBy && <span className="text-2xs text-ink-400">{e.administeredBy}</span>}
                            {e.omittedReason && <span className="text-2xs text-rose-500">{e.omittedReason}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          ),
        },
        {
          key: "validation", label: "Validación farmacia", badge: <Badge tone="amber">{validationQueue.length}</Badge>, content: (
            <Section title="Cola de validación de farmacia" testId="section-validation">
              {validationQueue.length === 0 ? <p className="text-sm text-ink-400">Sin medicamentos por validar.</p> : (
                <div className="space-y-1.5">
                  {validationQueue.slice(0, 40).map((mo) => {
                    const p = data.patients.find((x) => x.id === mo.patientId);
                    return (
                      <div key={mo.id} className="flex items-center gap-2 rounded-md border border-ink-200 px-3 py-2 text-sm">
                        <span className="flex-1"><span className="font-medium text-ink-800">{mo.medicationName}</span> <span className="text-2xs text-ink-500">{mo.dose}{mo.unit} · {p ? `${p.firstName} ${p.lastName}` : ""}</span></span>
                        {mo.flags.map((f) => <Badge key={f} tone="red">{f}</Badge>)}
                        <Button size="sm" onClick={() => { setMedValidation(mo.id, "validated"); addToast({ title: "Medicamento validado", variant: "success" }); }} data-testid={`validate-med-${mo.id}`}>Validar</Button>
                        <Button size="sm" variant="ghost" onClick={() => { setMedValidation(mo.id, "rejected"); addToast({ title: "Medicamento rechazado", variant: "warning" }); }} data-testid={`reject-med-${mo.id}`}>Rechazar</Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>
          ),
        },
      ]} />
    </PageContainer>
  );
}
