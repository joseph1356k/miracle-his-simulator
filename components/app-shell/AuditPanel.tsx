"use client";

import { useRouter } from "next/navigation";
import { useUI } from "@/lib/store/useUI";
import { useHospital } from "@/lib/store/useHospital";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils/format";

export function AuditPanel() {
  const open = useUI((s) => s.auditPanelOpen);
  const setOpen = useUI((s) => s.setAuditPanel);
  const audit = useHospital((s) => s.data.audit);
  const router = useRouter();

  return (
    <Drawer
      open={open}
      onClose={() => setOpen(false)}
      title="Auditoría reciente"
      description="Cada acción simulada genera un evento de auditoría."
      testId="drawer-audit-panel"
      width="lg"
      footer={<Button variant="outline" onClick={() => { router.push("/audit"); setOpen(false); }} data-testid="audit-panel-open-full">Ver auditoría completa</Button>}
    >
      <ul className="space-y-1.5" data-testid="audit-panel-list">
        {audit.slice(0, 40).map((e) => (
          <li key={e.id} className="rounded-md border border-ink-200 px-3 py-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Badge tone="blue">{e.action}</Badge>
                <span className="font-medium text-ink-800">{e.entity}</span>
              </div>
              <span className="text-2xs text-ink-400">{formatDateTime(e.timestamp)}</span>
            </div>
            <p className="mt-1 text-ink-500">
              {e.actor} · {e.module}
              {e.field ? ` · campo ${e.field}` : ""}
              {e.newValue ? ` → ${e.newValue}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </Drawer>
  );
}
