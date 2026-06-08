"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BedDouble, FileSignature, Home, ClipboardList } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Section, Stat } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextAreaField } from "@/components/ui/Field";
import { DiagnosisPicker } from "@/components/clinical/DiagnosisPicker";
import { useHospital } from "@/lib/store/useHospital";
import { useSession } from "@/lib/store/useSession";
import { useUI } from "@/lib/store/useUI";
import { genId } from "@/lib/utils/id";
import { nowIso, ageFromBirthDate, fullName, formatDateTime } from "@/lib/utils/format";
import { orderStatusMeta, labStatusMeta, imagingStatusMeta, labFlagMeta, referralStatusMeta } from "@/lib/utils/status";

export default function InpatientEncounterPage() {
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

  const [evolution, setEvolution] = useState("");
  const [dischargePlan, setDischargePlan] = useState("");

  const rel = useMemo(() => ({
    notes: data.notes.filter((n) => n.encounterId === params.id),
    orders: data.orders.filter((o) => o.encounterId === params.id),
    meds: data.medications.filter((m) => m.encounterId === params.id),
    labs: data.labs.filter((l) => l.encounterId === params.id),
    imaging: data.imaging.filter((i) => i.encounterId === params.id),
    vitals: data.vitals.filter((v) => v.encounterId === params.id),
    referrals: data.referrals.filter((r) => r.encounterId === params.id),
    diagnoses: data.diagnoses.filter((d) => d.encounterId === params.id),
    audit: data.audit.filter((a) => a.encounterId === params.id),
    surgeries: data.surgeries.filter((s) => s.patientId === encounter?.patientId),
  }), [data, params.id, encounter]);

  if (!encounter || !patient) return <PageContainer><p className="text-sm text-ink-500">Encuentro no encontrado.</p></PageContainer>;

  const saveEvolution = () => {
    if (!evolution.trim()) { addToast({ title: "Escriba la evolución", variant: "warning" }); return; }
    addNote({ id: genId("note"), encounterId: encounter.id, patientId: patient.id, type: "progress", title: "Evolución médica", status: "signed", author: userName, authorRole: roleId, createdAt: nowIso(), signedAt: nowIso(), body: evolution });
    addToast({ title: "Evolución firmada", variant: "success" });
    setEvolution("");
  };

  return (
    <PageContainer>
      <PageHeader
        title={fullName(patient)}
        description={`${ageFromBirthDate(patient.birthDate)} años · ${encounter.bed} · ${encounter.ward}`}
        icon={<BedDouble className="h-5 w-5" />}
        badge={<Badge tone="teal">{encounter.id}</Badge>}
        actions={<><Button variant="outline" onClick={() => router.push("/orders/new")} data-testid="inp-orders"><ClipboardList className="h-4 w-4" /> Órdenes</Button><Button onClick={() => router.push(`/discharge/${encounter.id}`)} data-testid="inp-discharge"><Home className="h-4 w-4" /> Plan de egreso</Button></>}
      />

      <Tabs tabs={[
        { key: "summary", label: "Resumen", content: (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Órdenes activas" value={rel.orders.filter((o) => o.status !== "completed" && o.status !== "cancelled").length} tone="blue" />
              <Stat label="Medicamentos" value={rel.meds.length} tone="teal" />
              <Stat label="Laboratorios" value={rel.labs.length} tone="amber" />
              <Stat label="Días de estancia" value={Math.max(1, Math.round((Date.now() - new Date(encounter.startedAt).getTime()) / 86400000))} />
            </div>
            <Section title="Diagnósticos activos" testId="section-summary-dx">
              <div className="flex flex-wrap gap-1.5">{rel.diagnoses.length ? rel.diagnoses.map((d) => <Badge key={d.id} tone="blue">{d.code} · {d.label}</Badge>) : <span className="text-sm text-ink-400">Sin diagnósticos.</span>}</div>
            </Section>
            <Section title="Últimos signos vitales" testId="section-summary-vitals">
              {rel.vitals.length === 0 ? <p className="text-sm text-ink-400">Sin registros.</p> : (
                <div className="flex flex-wrap gap-3 text-sm">{(() => { const v = rel.vitals[0]; return <><VBox label="TA" value={`${v.systolic}/${v.diastolic}`} /><VBox label="FC" value={v.heartRate} /><VBox label="FR" value={v.respiratoryRate} /><VBox label="T°" value={v.temperature} /><VBox label="SatO₂" value={`${v.spo2}%`} /></>; })()}</div>
              )}
            </Section>
          </div>
        ) },
        { key: "history", label: "Historia clínica", content: <NoteList notes={rel.notes} /> },
        { key: "evolution", label: "Evolución médica", content: (
          <div className="space-y-4">
            <Section title="Nueva evolución" testId="section-evolution" actions={<Button size="sm" onClick={saveEvolution} data-testid="button-sign-evolution"><FileSignature className="h-4 w-4" /> Firmar</Button>}>
              <TextAreaField id="ev-note" name="progressNote" testId="field-progress-note" label="Evolución médica" section="Evolución" rows={5} value={evolution} onChange={setEvolution} />
              <div className="mt-3"><DiagnosisPicker encounterId={encounter.id} patientId={patient.id} kind="relacionado" /></div>
            </Section>
            <NoteList notes={rel.notes.filter((n) => n.type === "progress")} />
          </div>
        ) },
        { key: "nursing", label: "Enfermería", content: (
          <div className="space-y-3">
            <Button size="sm" variant="outline" onClick={() => router.push("/nursing/notes")}>Ir a estación de enfermería</Button>
            <NoteList notes={rel.notes.filter((n) => n.type === "nursing")} empty="Sin notas de enfermería." />
          </div>
        ) },
        { key: "vitals", label: "Signos vitales", content: (
          <Section title="Tendencia de signos vitales" testId="section-vitals-trend">
            {rel.vitals.length === 0 ? <p className="text-sm text-ink-400">Sin registros.</p> : (
              <table className="w-full text-sm"><thead><tr className="text-left text-2xs uppercase text-ink-400"><th className="py-1">Hora</th><th>TA</th><th>FC</th><th>FR</th><th>T°</th><th>SatO₂</th><th>Dolor</th></tr></thead>
              <tbody>{rel.vitals.map((v) => <tr key={v.id} className="border-t border-ink-100"><td className="py-1.5 text-2xs text-ink-400">{formatDateTime(v.recordedAt)}</td><td>{v.systolic}/{v.diastolic}</td><td>{v.heartRate}</td><td>{v.respiratoryRate}</td><td>{v.temperature}</td><td>{v.spo2}%</td><td>{v.painScale}</td></tr>)}</tbody></table>
            )}
          </Section>
        ) },
        { key: "orders", label: "Órdenes activas", content: (
          <Section title="Órdenes" testId="section-enc-orders">
            {rel.orders.length === 0 ? <p className="text-sm text-ink-400">Sin órdenes.</p> : <div className="space-y-1.5">{rel.orders.map((o) => <div key={o.id} className="flex items-center gap-2 rounded-md border border-ink-200 px-3 py-1.5 text-sm"><span className="flex-1 text-ink-800">{o.name}</span><Badge tone={orderStatusMeta(o.status).tone}>{orderStatusMeta(o.status).label}</Badge></div>)}</div>}
          </Section>
        ) },
        { key: "meds", label: "Medicamentos", content: (
          <Section title="Medicamentos" testId="section-enc-meds">
            {rel.meds.length === 0 ? <p className="text-sm text-ink-400">Sin medicamentos.</p> : <div className="space-y-1.5">{rel.meds.map((m) => <div key={m.id} className="rounded-md border border-ink-200 px-3 py-1.5 text-sm"><span className="font-medium text-ink-800">{m.medicationName}</span> <span className="text-2xs text-ink-500">{m.dose}{m.unit} · {m.route} · {m.frequency}</span></div>)}</div>}
          </Section>
        ) },
        { key: "labs", label: "Laboratorios", content: (
          <Section title="Laboratorios" testId="section-enc-labs">
            {rel.labs.length === 0 ? <p className="text-sm text-ink-400">Sin laboratorios.</p> : <div className="space-y-1.5">{rel.labs.map((l) => <div key={l.id} className="flex items-center gap-2 rounded-md border border-ink-200 px-3 py-1.5 text-sm"><span className="flex-1 text-ink-800">{l.panel}</span>{l.results?.some((r) => r.flag === "critico") && <Badge tone="red">Crítico</Badge>}<Badge tone={labStatusMeta(l.status).tone}>{labStatusMeta(l.status).label}</Badge></div>)}</div>}
          </Section>
        ) },
        { key: "imaging", label: "Imágenes", content: (
          <Section title="Imágenes" testId="section-enc-imaging">
            {rel.imaging.length === 0 ? <p className="text-sm text-ink-400">Sin estudios.</p> : <div className="space-y-1.5">{rel.imaging.map((i) => <div key={i.id} className="flex items-center gap-2 rounded-md border border-ink-200 px-3 py-1.5 text-sm"><span className="flex-1 text-ink-800">{i.study}</span><Badge tone={imagingStatusMeta(i.status).tone}>{imagingStatusMeta(i.status).label}</Badge></div>)}</div>}
          </Section>
        ) },
        { key: "procedures", label: "Procedimientos", content: (
          <Section title="Procedimientos y cirugías" testId="section-enc-procedures">
            {rel.surgeries.length === 0 ? <p className="text-sm text-ink-400">Sin procedimientos.</p> : <div className="space-y-1.5">{rel.surgeries.map((s) => <div key={s.id} className="flex items-center gap-2 rounded-md border border-ink-200 px-3 py-1.5 text-sm"><span className="flex-1 text-ink-800">{s.procedure}</span><span className="text-2xs text-ink-400">{s.surgeon}</span><Badge tone="purple">{s.status}</Badge></div>)}</div>}
          </Section>
        ) },
        { key: "referrals", label: "Interconsultas", content: (
          <Section title="Interconsultas" testId="section-enc-referrals">
            {rel.referrals.length === 0 ? <p className="text-sm text-ink-400">Sin interconsultas.</p> : <div className="space-y-1.5">{rel.referrals.map((r) => <div key={r.id} className="flex items-center gap-2 rounded-md border border-ink-200 px-3 py-1.5 text-sm"><span className="flex-1 text-ink-800">{r.specialty} — {r.reason}</span><Badge tone={referralStatusMeta(r.status).tone}>{referralStatusMeta(r.status).label}</Badge></div>)}</div>}
          </Section>
        ) },
        { key: "discharge-plan", label: "Plan de egreso", content: (
          <Section title="Plan de egreso" testId="section-discharge-plan" actions={<Button size="sm" onClick={() => router.push(`/discharge/${encounter.id}`)}>Abrir epicrisis</Button>}>
            <TextAreaField id="dp-plan" name="dischargePlan" testId="field-discharge-plan" label="Planeación de egreso" section="Plan de egreso" rows={4} value={dischargePlan} onChange={setDischargePlan} help="Criterios de egreso, pendientes, educación y red de apoyo." />
          </Section>
        ) },
        { key: "epicrisis", label: "Epicrisis", content: (
          <Section title="Epicrisis" testId="section-enc-epicrisis"><p className="text-sm text-ink-500">La epicrisis se genera en el módulo de egresos.</p><Button className="mt-2" size="sm" onClick={() => router.push(`/discharge/${encounter.id}`)}>Generar epicrisis</Button></Section>
        ) },
        { key: "audit", label: "Auditoría", content: (
          <Section title="Auditoría del encuentro" testId="section-enc-audit">
            {rel.audit.length === 0 ? <p className="text-sm text-ink-400">Sin eventos.</p> : <div className="space-y-1">{rel.audit.slice(0, 40).map((a) => <div key={a.id} className="flex items-center gap-2 border-b border-ink-100 py-1 text-2xs"><span className="text-ink-400">{formatDateTime(a.timestamp)}</span><Badge tone="blue">{a.action}</Badge><span className="text-ink-600">{a.entity}</span><span className="flex-1 text-ink-500">{a.newValue}</span><span className="text-ink-400">{a.actor}</span></div>)}</div>}
          </Section>
        ) },
      ]} />
    </PageContainer>
  );
}

function VBox({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-md border border-ink-200 bg-ink-50 px-3 py-1.5"><div className="text-2xs uppercase text-ink-400">{label}</div><div className="text-sm font-semibold text-ink-800">{value ?? "—"}</div></div>;
}

function NoteList({ notes, empty = "Sin notas." }: { notes: { id: string; title: string; createdAt: string; status: string; sections?: Record<string, string>; body?: string }[]; empty?: string }) {
  if (notes.length === 0) return <p className="text-sm text-ink-400">{empty}</p>;
  return (
    <div className="space-y-2">
      {notes.map((n) => (
        <Section key={n.id} title={`${n.title} · ${formatDateTime(n.createdAt)}`} testId={`enc-note-${n.id}`} actions={<Badge tone={n.status === "signed" ? "green" : "slate"}>{n.status === "signed" ? "Firmada" : "Borrador"}</Badge>}>
          {n.sections ? <dl className="space-y-1 text-sm">{Object.entries(n.sections).filter(([, v]) => v).map(([k, v]) => <div key={k}><dt className="text-2xs font-semibold uppercase text-ink-400">{k}</dt><dd className="text-ink-700">{v}</dd></div>)}</dl> : <p className="whitespace-pre-wrap text-sm text-ink-700">{n.body}</p>}
        </Section>
      ))}
    </div>
  );
}
