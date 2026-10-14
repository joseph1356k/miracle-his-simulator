"use client";

import { useMemo } from "react";
import { Pill, PackageCheck } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Section, Stat } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useHospital } from "@/lib/store/useHospital";
import { useUI } from "@/lib/store/useUI";
import { fullName } from "@/lib/utils/format";
import { medValidationMeta } from "@/lib/utils/status";

export function PharmacyWorkspace({ defaultTab = "validation" }: { defaultTab?: string }) {
  const data = useHospital((s) => s.data);
  const setMedValidation = useHospital((s) => s.setMedValidation);
  const dispenseMedication = useHospital((s) => s.dispenseMedication);
  const addToast = useUI((s) => s.addToast);

  const name = (id: string) => { const p = data.patients.find((x) => x.id === id); return p ? fullName(p) : id; };
  const pending = useMemo(() => data.medications.filter((m) => m.validationStatus === "pending"), [data.medications]);
  const validated = useMemo(() => data.medications.filter((m) => m.validationStatus === "validated"), [data.medications]);
  // Por dispensar: validados que farmacia todavía no entregó. Los entregados pasan a "Dispensados hoy".
  const toDispense = useMemo(() => validated.filter((m) => !m.dispensedAt), [validated]);
  const dispensed = useMemo(
    () => validated.filter((m) => m.dispensedAt).sort((a, b) => (b.dispensedAt ?? "").localeCompare(a.dispensedAt ?? "")),
    [validated],
  );
  const lowStock = useMemo(() => data.inventory.filter((i) => i.category === "medicamento" && i.stock <= i.min), [data.inventory]);
  const hour = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "");

  return (
    <PageContainer>
      <PageHeader title="Farmacia" description="Validación farmacéutica, dispensación y alertas de stock." icon={<Pill className="h-5 w-5" />} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Por validar" value={pending.length} tone="amber" />
        <Stat label="Validados" value={validated.length} tone="green" />
        <Stat label="Medicamentos bajo stock" value={lowStock.length} tone="red" />
        <Stat label="Total formulados" value={data.medications.length} tone="blue" />
      </div>

      <Tabs defaultTab={defaultTab} tabs={[
        { key: "validation", label: "Validación", badge: <Badge tone="amber">{pending.length}</Badge>, content: (
          <Section title="Cola de validación farmacéutica" testId="section-pharmacy-validation">
            {pending.length === 0 ? <p className="text-sm text-ink-400">Sin medicamentos por validar.</p> : (
              <div className="space-y-1.5">
                {pending.slice(0, 50).map((m) => (
                  <div key={m.id} className="flex items-center gap-2 rounded-md border border-ink-200 px-3 py-2 text-sm">
                    <span className="flex-1"><span className="font-medium text-ink-800">{m.medicationName}</span> <span className="text-2xs text-ink-500">{m.dose}{m.unit} · {m.route} · {m.frequency} · {name(m.patientId)}</span></span>
                    {m.flags.map((f) => <Badge key={f} tone="red">{f}</Badge>)}
                    <Button size="sm" onClick={() => { setMedValidation(m.id, "validated"); addToast({ title: "Validado", variant: "success" }); }} data-testid={`pharmacy-validate-${m.id}`}>Validar</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setMedValidation(m.id, "rejected"); addToast({ title: "Rechazado", variant: "warning" }); }} data-testid={`pharmacy-reject-${m.id}`}>Rechazar</Button>
                  </div>
                ))}
              </div>
            )}
          </Section>
        ) },
        { key: "dispensing", label: "Dispensación", badge: <Badge tone="green">{toDispense.length}</Badge>, content: (
          <Section title="Medicamentos validados para dispensar" testId="section-pharmacy-dispensing">
            {toDispense.length === 0 ? <p className="text-sm text-ink-400">Nada por dispensar.</p> : (
              <div className="space-y-1.5">
                {toDispense.slice(0, 50).map((m) => (
                  <div key={m.id} className="flex items-center gap-2 rounded-md border border-ink-200 px-3 py-2 text-sm">
                    <Badge tone={medValidationMeta(m.validationStatus).tone}>{medValidationMeta(m.validationStatus).label}</Badge>
                    <span className="flex-1"><span className="font-medium text-ink-800">{m.medicationName}</span> <span className="text-2xs text-ink-500">{m.dose}{m.unit} · {name(m.patientId)}</span></span>
                    <Button size="sm" variant="outline" onClick={() => { dispenseMedication(m.id); addToast({ title: `Dispensado · ${m.medicationName}`, variant: "success" }); }} data-testid={`pharmacy-dispense-${m.id}`}><PackageCheck className="h-3.5 w-3.5" /> Dispensar</Button>
                  </div>
                ))}
              </div>
            )}
          </Section>
        ) },
        { key: "stock", label: "Alertas de stock", badge: <Badge tone="red">{lowStock.length}</Badge>, content: (
          <Section title="Medicamentos con bajo stock" testId="section-pharmacy-stock">
            {lowStock.length === 0 ? <p className="text-sm text-ink-400">Sin alertas.</p> : (
              <div className="space-y-1.5">
                {lowStock.map((i) => (
                  <div key={i.id} className="flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50/50 px-3 py-2 text-sm">
                    <span className="flex-1 text-ink-800">{i.name}</span>
                    {i.controlled ? <Badge tone="amber">Control especial</Badge> : null}
                    <Badge tone="red">{i.stock} / mín {i.min} {i.unit}</Badge>
                    <span className="text-2xs text-ink-400">{i.location}</span>
                  </div>
                ))}
              </div>
            )}
          </Section>
        ) },
      ]} />

      <Section title="Dispensados hoy" testId="section-pharmacy-dispensed">
        {dispensed.length === 0 ? <p className="text-sm text-ink-400">Todavía no se ha dispensado nada.</p> : (
          <div className="space-y-1.5">
            {dispensed.slice(0, 50).map((m) => (
              <div key={m.id} className="flex items-center gap-2 rounded-md border border-ink-200 px-3 py-2 text-sm">
                <Badge tone="blue">Dispensado</Badge>
                <span className="flex-1"><span className="font-medium text-ink-800">{m.medicationName}</span> <span className="text-2xs text-ink-500">{m.dose}{m.unit} · {name(m.patientId)} · {hour(m.dispensedAt)} · {m.dispensedBy}</span></span>
              </div>
            ))}
          </div>
        )}
      </Section>
    </PageContainer>
  );
}
