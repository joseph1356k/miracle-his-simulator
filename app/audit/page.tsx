"use client";

import { useMemo, useState } from "react";
import { ShieldCheck, Download } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Card } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useHospital } from "@/lib/store/useHospital";
import { ROLE_MAP } from "@/lib/config/roles";
import { formatDateTime, fullName } from "@/lib/utils/format";
import type { AuditEvent } from "@/lib/types";

export default function AuditPage() {
  const data = useHospital((s) => s.data);
  const [q, setQ] = useState("");
  const [moduleF, setModuleF] = useState("");
  const [actionF, setActionF] = useState("");

  const name = (id?: string) => { const p = data.patients.find((x) => x.id === id); return p ? fullName(p) : (id ?? "—"); };
  const modules = useMemo(() => [...new Set(data.audit.map((e) => e.module))].sort(), [data.audit]);
  const actions = useMemo(() => [...new Set(data.audit.map((e) => e.action))].sort(), [data.audit]);

  const filtered = useMemo(() => data.audit.filter((e) => {
    if (moduleF && e.module !== moduleF) return false;
    if (actionF && e.action !== actionF) return false;
    if (q) {
      const t = q.toLowerCase();
      return e.actor.toLowerCase().includes(t) || e.entity.toLowerCase().includes(t) || (e.field ?? "").toLowerCase().includes(t) || name(e.patientId).toLowerCase().includes(t);
    }
    return true;
  }), [data.audit, q, moduleF, actionF]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "miracle-audit.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const columns: Column<AuditEvent>[] = [
    { key: "timestamp", header: "Fecha/hora", render: (e) => <span className="whitespace-nowrap text-2xs text-ink-500">{formatDateTime(e.timestamp)}</span>, width: "150px" },
    { key: "actor", header: "Usuario", render: (e) => <div><div className="text-ink-800">{e.actor}</div><div className="text-2xs text-ink-400">{ROLE_MAP[e.actorRole]?.label ?? e.actorRole}</div></div> },
    { key: "action", header: "Acción", render: (e) => <Badge tone="blue">{e.action}</Badge> },
    { key: "entity", header: "Entidad", render: (e) => e.entity },
    { key: "module", header: "Módulo", render: (e) => <span className="text-ink-600">{e.module}</span> },
    { key: "patient", header: "Paciente", render: (e) => <span className="text-2xs">{name(e.patientId)}</span> },
    { key: "change", header: "Cambio", render: (e) => e.field ? <span className="text-2xs text-ink-500"><code>{e.field}</code>: {e.previousValue ?? "—"} → {e.newValue ?? "—"}</span> : <span className="text-2xs text-ink-400">{e.newValue ?? "—"}</span> },
    { key: "device", header: "Dispositivo/sesión", render: (e) => <span className="text-2xs text-ink-400">{e.device} · {e.session}</span> },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Auditoría y trazabilidad"
        description={`${data.audit.length} eventos. Cada edición simulada genera un registro de auditoría.`}
        icon={<ShieldCheck className="h-5 w-5" />}
        actions={<Button variant="outline" onClick={exportJson} data-testid="audit-export"><Download className="h-4 w-4" /> Exportar JSON</Button>}
      />

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <input data-testid="audit-search" aria-label="Buscar en auditoría" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Usuario, entidad, campo o paciente…" className="h-9 min-w-[220px] flex-1 rounded-md border border-ink-200 px-2.5 text-sm" />
          <select aria-label="Módulo" data-testid="audit-filter-module" value={moduleF} onChange={(e) => setModuleF(e.target.value)} className="h-9 rounded-md border border-ink-200 px-2 text-sm">
            <option value="">Todos los módulos</option>
            {modules.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select aria-label="Acción" data-testid="audit-filter-action" value={actionF} onChange={(e) => setActionF(e.target.value)} className="h-9 rounded-md border border-ink-200 px-2 text-sm">
            <option value="">Todas las acciones</option>
            {actions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <Badge tone="neutral">{filtered.length} eventos</Badge>
        </div>
      </Card>

      <DataTable columns={columns} rows={filtered.slice(0, 200)} getRowId={(e) => e.id} testId="audit-table" dense rowTestId={(e) => `audit-row-${e.id}`} />
      {filtered.length > 200 && <p className="text-center text-2xs text-ink-400">Mostrando los primeros 200 de {filtered.length} eventos.</p>}
    </PageContainer>
  );
}
