"use client";

import { useMemo, useState } from "react";
import { Boxes, AlertTriangle, CalendarClock } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Card, Stat } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { useHospital } from "@/lib/store/useHospital";
import { formatDate } from "@/lib/utils/format";
import type { InventoryItem } from "@/lib/types";

const CAT_LABEL: Record<string, string> = { medicamento: "Medicamento", "insumo-quirurgico": "Insumo quirúrgico", "insumo-lab": "Insumo de laboratorio", "stock-piso": "Stock de piso" };
const DAY = 86400000;

export function InventoryWorkspace({ title = "Inventario clínico", lockCategory }: { title?: string; lockCategory?: InventoryItem["category"] }) {
  const inventory = useHospital((s) => s.data.inventory);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState(lockCategory ?? "");

  const expiringSoon = (i: InventoryItem) => new Date(i.expiry).getTime() - Date.now() < 60 * DAY;
  const rows = useMemo(() => inventory.filter((i) => {
    if (lockCategory && i.category !== lockCategory) return false;
    if (cat && i.category !== cat) return false;
    if (q) return i.name.toLowerCase().includes(q.toLowerCase()) || i.lot.toLowerCase().includes(q.toLowerCase());
    return true;
  }), [inventory, q, cat, lockCategory]);

  const lowStock = rows.filter((i) => i.stock <= i.min);
  const expiring = rows.filter(expiringSoon);

  const cols: Column<InventoryItem>[] = [
    { key: "name", header: "Insumo", render: (i) => <div><div className="font-medium text-ink-900">{i.name}</div><div className="text-2xs text-ink-400">{CAT_LABEL[i.category]} · Lote {i.lot}</div></div> },
    { key: "stock", header: "Existencias", render: (i) => <span className={i.stock <= i.min ? "font-semibold text-rose-600" : "text-ink-700"}>{i.stock} {i.unit}</span> },
    { key: "min", header: "Mínimo", render: (i) => <span className="text-2xs text-ink-400">{i.min}</span> },
    { key: "alert", header: "Alertas", render: (i) => <div className="flex gap-1">{i.stock <= i.min && <Badge tone="red">Bajo stock</Badge>}{expiringSoon(i) && <Badge tone="amber">Por vencer</Badge>}</div> },
    { key: "expiry", header: "Vence", render: (i) => <span className="text-2xs text-ink-500">{formatDate(i.expiry)}</span> },
    { key: "supplier", header: "Proveedor", render: (i) => <span className="text-2xs text-ink-500">{i.supplier}</span> },
    { key: "location", header: "Ubicación", render: (i) => <span className="text-2xs text-ink-500">{i.location}</span> },
  ];

  return (
    <PageContainer>
      <PageHeader title={title} description="Existencias, alertas de bajo stock y vencimientos próximos." icon={<Boxes className="h-5 w-5" />} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Ítems" value={rows.length} tone="blue" />
        <Stat label="Bajo stock" value={lowStock.length} tone="red" icon={<AlertTriangle className="h-4 w-4" />} />
        <Stat label="Por vencer (60d)" value={expiring.length} tone="amber" icon={<CalendarClock className="h-4 w-4" />} />
        <Stat label="Categorías" value={new Set(rows.map((i) => i.category)).size} />
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <input data-testid="inventory-search" aria-label="Buscar insumo" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o lote…" className="h-9 min-w-[220px] flex-1 rounded-md border border-ink-200 px-2.5 text-sm" />
          {!lockCategory && (
            <select aria-label="Categoría" data-testid="inventory-filter-category" value={cat} onChange={(e) => setCat(e.target.value)} className="h-9 rounded-md border border-ink-200 px-2 text-sm">
              <option value="">Todas las categorías</option>
              {Object.entries(CAT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          )}
        </div>
      </Card>

      <DataTable columns={cols} rows={rows} getRowId={(i) => i.id} testId="inventory-table" rowTestId={(i) => `inventory-row-${i.id}`} />
    </PageContainer>
  );
}
