"use client";

import { useMemo, useState } from "react";
import { CreditCard, Plus } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Section, Stat } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextField, SelectField } from "@/components/ui/Field";
import { SelectedPatientBanner } from "@/components/clinical/SelectedPatientBanner";
import { useSelected } from "@/lib/hooks/useSelected";
import { useHospital } from "@/lib/store/useHospital";
import { useUI } from "@/lib/store/useUI";
import { genId } from "@/lib/utils/id";
import { nowIso, fullName, currencyCOP, minutesToHuman } from "@/lib/utils/format";
import { EPS_LIST } from "@/lib/data/catalogs";
import { authStatusMeta } from "@/lib/utils/status";
import type { Authorization, BillingCase } from "@/lib/types";

export function BillingWorkspace({ defaultTab = "authorizations" }: { defaultTab?: string }) {
  const { patient, encounter } = useSelected();
  const data = useHospital((s) => s.data);
  const setAuthStatus = useHospital((s) => s.setAuthStatus);
  const addAuthorization = useHospital((s) => s.addAuthorization);
  const addToast = useUI((s) => s.addToast);
  const [statusF, setStatusF] = useState("");
  const [form, setForm] = useState({ eps: EPS_LIST[0], service: "" });

  const name = (id: string) => { const p = data.patients.find((x) => x.id === id); return p ? fullName(p) : id; };
  const auths = useMemo(() => data.authorizations.filter((a) => statusF ? a.status === statusF : true), [data.authorizations, statusF]);

  const totalOf = (b: BillingCase) => b.items.reduce((acc, it) => acc + it.qty * it.unitPrice, 0);

  const createAuth = () => {
    if (!patient) { addToast({ title: "Seleccione un paciente", variant: "warning" }); return; }
    if (!form.service) { addToast({ title: "Indique el servicio", variant: "warning" }); return; }
    const a: Authorization = { id: genId("auth"), patientId: patient.id, encounterId: encounter?.id ?? "sin-encuentro", eps: form.eps, service: form.service, status: "pending", requestedAt: nowIso(), delayHours: 0 };
    addAuthorization(a);
    addToast({ title: "Autorización solicitada", variant: "success" });
    setForm((f) => ({ ...f, service: "" }));
  };

  return (
    <PageContainer>
      <PageHeader title="Facturación y autorizaciones EPS" description="Cola de autorizaciones, validación de cobertura y facturas (simulado)." icon={<CreditCard className="h-5 w-5" />} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Autorizaciones pendientes" value={data.authorizations.filter((a) => a.status === "pending").length} tone="amber" />
        <Stat label="Negadas" value={data.authorizations.filter((a) => a.status === "denied").length} tone="red" />
        <Stat label="Requieren soportes" value={data.authorizations.filter((a) => a.status === "docs-required").length} tone="purple" />
        <Stat label="Facturas abiertas" value={data.billing.filter((b) => b.status === "open").length} tone="blue" />
      </div>

      <Tabs defaultTab={defaultTab} tabs={[
        { key: "authorizations", label: "Autorizaciones", badge: <Badge tone="amber">{data.authorizations.filter((a) => a.status === "pending").length}</Badge>, content: (
          <div className="space-y-4">
            <SelectedPatientBanner requirement="solicitar autorización" />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Section title="Nueva autorización" testId="section-new-auth">
                <div className="grid gap-3">
                  <SelectField id="bl-eps" name="eps" testId="field-auth-eps" label="EPS" section="Autorización" value={form.eps} onChange={(v) => setForm((f) => ({ ...f, eps: v }))} options={EPS_LIST} />
                  <TextField id="bl-service" name="service" testId="field-auth-service" label="Servicio a autorizar" section="Autorización" value={form.service} onChange={(v) => setForm((f) => ({ ...f, service: v }))} placeholder="Ej: Resonancia magnética" />
                  <Button onClick={createAuth} data-testid="button-create-auth"><Plus className="h-4 w-4" /> Solicitar</Button>
                </div>
              </Section>

              <Section title="Cola de autorizaciones" testId="section-auth-queue" className="lg:col-span-2" actions={
                <select aria-label="Filtrar estado" data-testid="auth-filter-status" value={statusF} onChange={(e) => setStatusF(e.target.value)} className="h-8 rounded-md border border-ink-200 px-2 text-xs">
                  <option value="">Todas</option><option value="pending">Pendiente</option><option value="approved">Aprobada</option><option value="denied">Negada</option><option value="docs-required">Requiere soportes</option>
                </select>
              }>
                <div className="space-y-1.5">
                  {auths.slice(0, 30).map((a) => (
                    <div key={a.id} className="flex flex-wrap items-center gap-2 rounded-md border border-ink-200 px-3 py-2 text-sm" data-testid={`auth-${a.id}`}>
                      <span className="font-medium text-ink-800">{a.service}</span>
                      <span className="flex-1 text-2xs text-ink-500">{name(a.patientId)} · {a.eps} · demora {minutesToHuman(a.delayHours * 60)}</span>
                      <Badge tone={authStatusMeta(a.status).tone}>{authStatusMeta(a.status).label}</Badge>
                      {a.status === "pending" && <><Button size="sm" variant="outline" onClick={() => { setAuthStatus(a.id, "approved"); addToast({ title: "Aprobada", variant: "success" }); }} data-testid={`auth-approve-${a.id}`}>Aprobar</Button><Button size="sm" variant="ghost" onClick={() => { setAuthStatus(a.id, "denied"); addToast({ title: "Negada", variant: "warning" }); }} data-testid={`auth-deny-${a.id}`}>Negar</Button><Button size="sm" variant="ghost" onClick={() => setAuthStatus(a.id, "docs-required")} data-testid={`auth-docs-${a.id}`}>Soportes</Button></>}
                    </div>
                  ))}
                  {auths.length === 0 && <p className="text-sm text-ink-400">Sin autorizaciones.</p>}
                </div>
              </Section>
            </div>
          </div>
        ) },
        { key: "invoices", label: "Facturas", content: (
          <div className="space-y-3">
            {data.billing.map((b) => (
              <Section key={b.id} testId={`invoice-${b.id}`} title={`${name(b.patientId)} · ${b.eps}`} actions={<div className="flex items-center gap-2"><Badge tone="neutral">{b.status}</Badge><span className="text-sm font-semibold text-ink-900">{currencyCOP(totalOf(b))}</span></div>}>
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-2xs uppercase text-ink-400"><th className="py-1">Código</th><th>Descripción</th><th className="text-right">Cant.</th><th className="text-right">Vlr unit.</th><th className="text-right">Total</th></tr></thead>
                  <tbody>
                    {b.items.map((it, i) => <tr key={i} className="border-t border-ink-100"><td className="py-1.5 font-mono text-2xs">{it.code}</td><td className="text-ink-700">{it.description}</td><td className="text-right">{it.qty}</td><td className="text-right">{currencyCOP(it.unitPrice)}</td><td className="text-right font-medium">{currencyCOP(it.qty * it.unitPrice)}</td></tr>)}
                  </tbody>
                </table>
                {b.copay > 0 && <p className="mt-2 text-2xs text-ink-500">Copago: {currencyCOP(b.copay)}</p>}
              </Section>
            ))}
          </div>
        ) },
      ]} />
    </PageContainer>
  );
}
