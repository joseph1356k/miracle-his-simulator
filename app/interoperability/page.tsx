"use client";

import { useMemo, useState } from "react";
import { Radiation, Download, Check } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Section, Stat } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useHospital } from "@/lib/store/useHospital";
import { useUI } from "@/lib/store/useUI";
import { ageFromBirthDate, fullName } from "@/lib/utils/format";

export default function InteroperabilityPage() {
  const data = useHospital((s) => s.data);
  const addToast = useUI((s) => s.addToast);
  const activeEncounters = data.encounters.filter((e) => e.status === "admitted" || e.status === "in-progress" || e.status === "observation");
  const [encId, setEncId] = useState(activeEncounters[0]?.id ?? data.encounters[0]?.id ?? "");

  const bundle = useMemo(() => {
    const enc = data.encounters.find((e) => e.id === encId);
    if (!enc) return null;
    const p = data.patients.find((x) => x.id === enc.patientId);
    if (!p) return null;
    const ref = (t: string, id: string) => ({ reference: `${t}/${id}` });
    const entries: any[] = [];
    entries.push({ resourceType: "Patient", id: p.id, identifier: [{ system: "demo:document", value: `${p.documentType}-${p.documentNumber}` }], name: [{ family: p.lastName, given: [p.firstName] }], gender: p.sex === "M" ? "male" : p.sex === "F" ? "female" : "other", birthDate: p.birthDate });
    entries.push({ resourceType: "Encounter", id: enc.id, status: enc.status, class: { code: enc.type }, subject: ref("Patient", p.id), reasonCode: [{ text: enc.reason }] });
    p.allergies.forEach((a) => entries.push({ resourceType: "AllergyIntolerance", id: a.id, patient: ref("Patient", p.id), code: { text: a.substance }, criticality: a.severity === "severa" ? "high" : "low", reaction: [{ description: a.reaction }] }));
    data.diagnoses.filter((d) => d.encounterId === enc.id).forEach((d) => entries.push({ resourceType: "Condition", id: d.id, subject: ref("Patient", p.id), encounter: ref("Encounter", enc.id), code: { coding: [{ system: "demo:cie10", code: d.code, display: d.label }] }, verificationStatus: { text: d.status } }));
    data.vitals.filter((v) => v.encounterId === enc.id).slice(0, 5).forEach((v) => entries.push({ resourceType: "Observation", id: v.id, status: "final", category: [{ text: "vital-signs" }], subject: ref("Patient", p.id), component: [{ code: { text: "Tensión arterial" }, valueString: `${v.systolic}/${v.diastolic}` }, { code: { text: "Frecuencia cardiaca" }, valueQuantity: { value: v.heartRate, unit: "lpm" } }, { code: { text: "SatO2" }, valueQuantity: { value: v.spo2, unit: "%" } }] }));
    data.medications.filter((m) => m.encounterId === enc.id).forEach((m) => entries.push({ resourceType: "MedicationRequest", id: m.id, status: "active", intent: "order", subject: ref("Patient", p.id), medicationCodeableConcept: { text: m.medicationName }, dosageInstruction: [{ text: `${m.dose}${m.unit} ${m.route} ${m.frequency}` }] }));
    data.orders.filter((o) => o.encounterId === enc.id).forEach((o) => entries.push({ resourceType: "ServiceRequest", id: o.id, status: o.status, intent: "order", category: [{ text: o.category }], code: { text: o.name }, subject: ref("Patient", p.id) }));
    data.labs.filter((l) => l.encounterId === enc.id && l.results).forEach((l) => entries.push({ resourceType: "DiagnosticReport", id: l.id, status: "final", code: { text: l.panel }, subject: ref("Patient", p.id), result: (l.results ?? []).map((r) => ({ display: `${r.test}: ${r.value} ${r.unit}` })) }));
    data.surgeries.filter((s) => s.patientId === p.id).forEach((s) => entries.push({ resourceType: "Procedure", id: s.id, status: s.status === "completed" ? "completed" : "in-progress", code: { text: s.procedure }, subject: ref("Patient", p.id) }));
    data.notes.filter((n) => n.encounterId === enc.id).forEach((n) => entries.push({ resourceType: "DocumentReference", id: n.id, status: "current", type: { text: n.title }, subject: ref("Patient", p.id), date: n.createdAt }));
    entries.push({ resourceType: "CarePlan", id: `cp-${enc.id}`, status: "active", intent: "plan", subject: ref("Patient", p.id), title: "Plan de atención (demo)" });
    return { resourceType: "Bundle", type: "document", meta: { tag: [{ display: "RDA/IHCE demo — no certificado" }] }, timestamp: new Date().toISOString(), entry: entries.map((resource) => ({ resource })) };
  }, [encId, data]);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    bundle?.entry.forEach((e: any) => { m[e.resource.resourceType] = (m[e.resource.resourceType] ?? 0) + 1; });
    return m;
  }, [bundle]);

  const exportJson = () => {
    if (!bundle) return;
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `miracle-fhir-${encId}.json`; a.click();
    URL.revokeObjectURL(url);
    addToast({ title: "Bundle exportado", variant: "success" });
  };

  const enc = data.encounters.find((e) => e.id === encId);
  const patient = data.patients.find((p) => p.id === enc?.patientId);

  return (
    <PageContainer>
      <PageHeader title="Interoperabilidad (FHIR-like)" description="Resumen de atención tipo RDA/IHCE y exportación FHIR-inspirada. Demo, no certificado." icon={<Radiation className="h-5 w-5" />}
        actions={<Button onClick={exportJson} data-testid="interop-export"><Download className="h-4 w-4" /> Exportar JSON</Button>} />

      <Section title="Encuentro a exportar" testId="section-interop-select">
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Seleccionar encuentro" data-testid="interop-encounter-select" value={encId} onChange={(e) => setEncId(e.target.value)} className="h-9 min-w-[280px] rounded-md border border-ink-200 px-2 text-sm">
            {data.encounters.slice(0, 60).map((e) => { const p = data.patients.find((x) => x.id === e.patientId); return <option key={e.id} value={e.id}>{p ? fullName(p) : e.patientId} · {e.type} · {e.id}</option>; })}
          </select>
          {patient && <Badge tone="blue">{fullName(patient)} · {ageFromBirthDate(patient.birthDate)}a</Badge>}
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <Section title="Recursos del bundle" testId="section-interop-resources">
            <div className="space-y-1.5">
              {["Patient", "Encounter", "Observation", "Condition", "MedicationRequest", "AllergyIntolerance", "Procedure", "DiagnosticReport", "ServiceRequest", "CarePlan", "DocumentReference"].map((r) => (
                <div key={r} className="flex items-center justify-between rounded-md border border-ink-200 px-3 py-1.5 text-sm">
                  <span className="text-ink-700">{r}</span>
                  <Badge tone={counts[r] ? "green" : "neutral"}>{counts[r] ?? 0}</Badge>
                </div>
              ))}
            </div>
          </Section>
          <Section title="Lista de verificación" testId="section-interop-validation">
            <ul className="space-y-1.5 text-sm">
              {["Identificación del paciente", "Confidencialidad y habeas data", "Trazabilidad de la atención", "Continuidad asistencial", "Resumen estandarizado (RDA)"].map((c) => (
                <li key={c} className="flex items-center gap-2 text-ink-700"><Check className="h-4 w-4 text-emerald-500" /> {c}</li>
              ))}
            </ul>
            <Badge tone="amber" className="mt-3">Estado: demostrativo, no certificado</Badge>
          </Section>
        </div>

        <Section title="FHIR-like JSON" testId="section-interop-json" className="lg:col-span-2">
          <pre data-testid="interop-json" className="max-h-[60vh] overflow-auto rounded-md bg-ink-950 p-3 text-2xs leading-relaxed text-emerald-50">{bundle ? JSON.stringify(bundle, null, 2) : "—"}</pre>
        </Section>
      </div>
    </PageContainer>
  );
}
