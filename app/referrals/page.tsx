"use client";

import { useMemo, useState } from "react";
import { Network, Plus } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Section, Stat } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextField, TextAreaField, SelectField } from "@/components/ui/Field";
import { SelectedPatientBanner } from "@/components/clinical/SelectedPatientBanner";
import { useSelected } from "@/lib/hooks/useSelected";
import { useHospital } from "@/lib/store/useHospital";
import { useSession } from "@/lib/store/useSession";
import { useUI } from "@/lib/store/useUI";
import { genId } from "@/lib/utils/id";
import { nowIso, fullName, relativeFromNow } from "@/lib/utils/format";
import { SPECIALTIES } from "@/lib/data/catalogs";
import { referralStatusMeta, priorityMeta } from "@/lib/utils/status";
import type { Referral } from "@/lib/types";

export default function ReferralsPage() {
  const { patient, encounter } = useSelected();
  const data = useHospital((s) => s.data);
  const addReferral = useHospital((s) => s.addReferral);
  const setReferralStatus = useHospital((s) => s.setReferralStatus);
  const { userName } = useSession();
  const addToast = useUI((s) => s.addToast);

  const [f, setF] = useState({ kind: "interconsulta", specialty: SPECIALTIES[0], reason: "", priority: "rutina", attachments: "" });
  const upd = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));
  const name = (id: string) => { const p = data.patients.find((x) => x.id === id); return p ? fullName(p) : id; };

  const create = () => {
    if (!patient) { addToast({ title: "Seleccione un paciente", variant: "warning" }); return; }
    const r: Referral = {
      id: genId("ref"), patientId: patient.id, encounterId: encounter?.id ?? "sin-encuentro",
      kind: f.kind as Referral["kind"], specialty: f.specialty, reason: f.reason, priority: f.priority as Referral["priority"],
      status: "requested", requestedBy: userName, requestedAt: nowIso(),
    };
    addReferral(r);
    addToast({ title: "Solicitud creada", description: `${f.kind} · ${f.specialty}`, variant: "success" });
    setF((s) => ({ ...s, reason: "" }));
  };

  const sorted = useMemo(() => [...data.referrals].sort((a, b) => (a.requestedAt < b.requestedAt ? 1 : -1)), [data.referrals]);

  return (
    <PageContainer>
      <PageHeader title="Remisiones e interconsultas" description="Solicitudes a especialistas internos y remisiones externas." icon={<Network className="h-5 w-5" />} />
      <SelectedPatientBanner requirement="crear una remisión" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Solicitadas" value={data.referrals.filter((r) => r.status === "requested").length} tone="amber" />
        <Stat label="Aceptadas" value={data.referrals.filter((r) => r.status === "accepted").length} tone="blue" />
        <Stat label="Respondidas" value={data.referrals.filter((r) => r.status === "answered").length} tone="green" />
        <Stat label="Total" value={data.referrals.length} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Section title="Nueva solicitud" testId="section-new-referral">
          <div className="grid gap-3">
            <SelectField id="rf-kind" name="kind" testId="field-referral-kind" label="Tipo" section="Remisión" value={f.kind} onChange={(v) => upd("kind", v)} options={[{ value: "interconsulta", label: "Interconsulta interna" }, { value: "remision", label: "Remisión externa" }]} />
            <SelectField id="rf-spec" name="specialty" testId="field-referral-specialty" label="Especialidad solicitada" section="Remisión" value={f.specialty} onChange={(v) => upd("specialty", v)} options={SPECIALTIES} />
            <SelectField id="rf-prio" name="priority" testId="field-referral-priority" label="Prioridad" section="Remisión" value={f.priority} onChange={(v) => upd("priority", v)} options={[{ value: "rutina", label: "Rutina" }, { value: "prioritario", label: "Prioritario" }, { value: "urgente", label: "Urgente" }]} />
            <TextAreaField id="rf-reason" name="reason" testId="field-referral-reason" label="Razón clínica" section="Remisión" rows={3} value={f.reason} onChange={(v) => upd("reason", v)} />
            <TextField id="rf-att" name="attachments" testId="field-referral-attachments" label="Adjuntos (placeholder)" section="Remisión" value={f.attachments} onChange={(v) => upd("attachments", v)} placeholder="resumen.pdf, laboratorios.pdf" />
            <Button onClick={create} data-testid="button-create-referral"><Plus className="h-4 w-4" /> Crear solicitud</Button>
          </div>
        </Section>

        <Section title="Solicitudes" testId="section-referral-list" className="lg:col-span-2">
          <div className="space-y-1.5">
            {sorted.length === 0 && <p className="text-sm text-ink-400">Sin solicitudes.</p>}
            {sorted.slice(0, 30).map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-2 rounded-md border border-ink-200 px-3 py-2 text-sm" data-testid={`referral-${r.id}`}>
                <Badge tone="slate">{r.kind}</Badge>
                <span className="font-medium text-ink-800">{r.specialty}</span>
                <span className="flex-1 text-2xs text-ink-500">{name(r.patientId)} · {r.reason || "—"} · {relativeFromNow(r.requestedAt)}</span>
                <Badge tone={priorityMeta(r.priority).tone}>{priorityMeta(r.priority).label}</Badge>
                <Badge tone={referralStatusMeta(r.status).tone}>{referralStatusMeta(r.status).label}</Badge>
                {r.status === "requested" && <><Button size="sm" variant="outline" onClick={() => { setReferralStatus(r.id, "accepted"); addToast({ title: "Aceptada", variant: "success" }); }} data-testid={`referral-accept-${r.id}`}>Aceptar</Button><Button size="sm" variant="ghost" onClick={() => { setReferralStatus(r.id, "rejected"); addToast({ title: "Rechazada", variant: "warning" }); }} data-testid={`referral-reject-${r.id}`}>Rechazar</Button></>}
                {r.status === "accepted" && <Button size="sm" onClick={() => { setReferralStatus(r.id, "answered", "Respondida por especialista (demo)."); addToast({ title: "Respondida", variant: "success" }); }} data-testid={`referral-answer-${r.id}`}>Responder</Button>}
              </div>
            ))}
          </div>
        </Section>
      </div>
    </PageContainer>
  );
}
