"use client";

import { Settings as SettingsIcon, RotateCcw } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Section } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/Table";
import { useHospital } from "@/lib/store/useHospital";
import { useUI } from "@/lib/store/useUI";
import { ROLES } from "@/lib/config/roles";
import { CIE10_CATALOG, MEDICATION_CATALOG, LAB_CATALOG, EPS_LIST, WARDS, SPECIALTIES, CATALOG_DISCLAIMER } from "@/lib/data/catalogs";

export default function SettingsPage() {
  const resetData = useHospital((s) => s.resetData);
  const addToast = useUI((s) => s.addToast);

  return (
    <PageContainer>
      <PageHeader title="Configuración" description="Sedes, departamentos, usuarios, roles, plantillas y diccionarios clínicos." icon={<SettingsIcon className="h-5 w-5" />} />

      <Tabs tabs={[
        { key: "general", label: "General", content: (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Section title="Sedes" testId="section-locations">
              <ul className="space-y-1.5 text-sm">{["Sede Central", "Sede Norte", "Sede Sur (ambulatoria)"].map((l) => <li key={l} className="flex items-center justify-between rounded-md border border-ink-200 px-3 py-1.5"><span>{l}</span><Badge tone="blue">Activa</Badge></li>)}</ul>
            </Section>
            <Section title="Departamentos / servicios" testId="section-departments">
              <div className="flex flex-wrap gap-1.5">{WARDS.map((w) => <Badge key={w} tone="slate">{w}</Badge>)}</div>
            </Section>
            <Section title="Aseguradoras / EPS" testId="section-eps">
              <div className="flex flex-wrap gap-1.5">{EPS_LIST.map((e) => <Badge key={e} tone="teal">{e}</Badge>)}</div>
            </Section>
            <Section title="Especialidades" testId="section-specialties">
              <div className="flex flex-wrap gap-1.5">{SPECIALTIES.map((s) => <Badge key={s} tone="purple">{s}</Badge>)}</div>
            </Section>
          </div>
        ) },
        { key: "roles", label: "Roles y usuarios", content: (
          <Section title="Roles del sistema" testId="section-roles">
            <DataTable
              testId="settings-roles-table"
              columns={[
                { key: "label", header: "Rol", render: (r: typeof ROLES[number]) => <span className="font-medium text-ink-900">{r.label}</span> },
                { key: "desc", header: "Descripción", render: (r: typeof ROLES[number]) => <span className="text-2xs text-ink-500">{r.description}</span> },
                { key: "sign", header: "Firma notas", render: (r: typeof ROLES[number]) => <Badge tone={r.canSignNotes ? "green" : "neutral"}>{r.canSignNotes ? "Sí" : "No"}</Badge> },
                { key: "rx", header: "Prescribe", render: (r: typeof ROLES[number]) => <Badge tone={r.canPrescribe ? "green" : "neutral"}>{r.canPrescribe ? "Sí" : "No"}</Badge> },
                { key: "admin", header: "Administra", render: (r: typeof ROLES[number]) => <Badge tone={r.canAdminister ? "green" : "neutral"}>{r.canAdminister ? "Sí" : "No"}</Badge> },
                { key: "modules", header: "Módulos", render: (r: typeof ROLES[number]) => <span className="text-2xs text-ink-500">{r.modules === "*" ? "Todos" : `${r.modules.length} módulos`}</span> },
              ]}
              rows={ROLES}
              getRowId={(r) => r.id}
            />
          </Section>
        ) },
        { key: "catalogs", label: "Diccionarios clínicos", content: (
          <div className="space-y-4">
            <Badge tone="amber">{CATALOG_DISCLAIMER}</Badge>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Section title="CIE-10 (muestra)" testId="section-cie10">
                <div className="max-h-72 space-y-1 overflow-auto">{CIE10_CATALOG.map((c) => <div key={c.code} className="flex items-center gap-2 text-sm"><Badge tone="blue">{c.code}</Badge><span className="text-ink-600">{c.label}</span></div>)}</div>
              </Section>
              <Section title="Medicamentos (muestra)" testId="section-med-catalog">
                <div className="max-h-72 space-y-1 overflow-auto text-sm">{MEDICATION_CATALOG.map((m) => <div key={m.name} className="text-ink-700"><span className="font-medium">{m.name}</span> <span className="text-2xs text-ink-400">{m.generic}</span></div>)}</div>
              </Section>
              <Section title="Laboratorio (muestra)" testId="section-lab-catalog">
                <div className="max-h-72 space-y-1 overflow-auto text-sm">{LAB_CATALOG.map((l) => <div key={l.panel} className="text-ink-700"><span className="font-medium">{l.panel}</span> <span className="text-2xs text-ink-400">{l.tests.length} pruebas</span></div>)}</div>
              </Section>
            </div>
          </div>
        ) },
        { key: "data", label: "Datos", content: (
          <Section title="Datos sintéticos" testId="section-data-reset">
            <p className="text-sm text-ink-600">Toda la información es sintética y se guarda localmente (localStorage). Puede restablecer el conjunto de datos demostrativo en cualquier momento.</p>
            <Button className="mt-3" variant="danger" onClick={() => { resetData(); addToast({ title: "Datos restablecidos", description: "Se regeneró el conjunto sintético.", variant: "success" }); }} data-testid="settings-reset-data"><RotateCcw className="h-4 w-4" /> Restablecer datos demo</Button>
          </Section>
        ) },
      ]} />
    </PageContainer>
  );
}
