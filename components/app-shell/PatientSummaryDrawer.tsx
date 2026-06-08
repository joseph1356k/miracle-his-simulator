"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUI } from "@/lib/store/useUI";
import { useSession } from "@/lib/store/useSession";
import { useHospital } from "@/lib/store/useHospital";
import { Drawer } from "@/components/ui/Drawer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ageFromBirthDate, formatDate, fullName, formatDateTime } from "@/lib/utils/format";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 py-1 text-sm">
      <span className="text-ink-500">{label}</span>
      <span className="text-right font-medium text-ink-800">{value}</span>
    </div>
  );
}

export function PatientSummaryDrawer() {
  const open = useUI((s) => s.patientDrawerOpen);
  const setOpen = useUI((s) => s.setPatientDrawer);
  const selectedPatientId = useSession((s) => s.selectedPatientId);
  const data = useHospital((s) => s.data);
  const router = useRouter();

  const ctx = useMemo(() => {
    const patient = data.patients.find((p) => p.id === selectedPatientId);
    if (!patient) return null;
    const encounters = data.encounters.filter((e) => e.patientId === patient.id);
    const meds = data.medications.filter((m) => m.patientId === patient.id);
    const labs = data.labs.filter((l) => l.patientId === patient.id);
    return { patient, encounters, meds, labs };
  }, [selectedPatientId, data]);

  return (
    <Drawer
      open={open && !!ctx}
      onClose={() => setOpen(false)}
      title="Resumen del paciente"
      description="Vista lateral de contexto clínico (datos sintéticos)."
      testId="drawer-patient-summary"
      width="lg"
      footer={
        ctx && (
          <Button data-testid="drawer-open-full-record" onClick={() => { router.push(`/patients/${ctx.patient.id}`); setOpen(false); }}>
            Abrir historia completa
          </Button>
        )
      }
    >
      {ctx && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-ink-900">{fullName(ctx.patient)}</h3>
            <p className="text-xs text-ink-500">{ageFromBirthDate(ctx.patient.birthDate)} años · {ctx.patient.documentType} {ctx.patient.documentNumber} · HC {ctx.patient.recordNumber}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ctx.patient.allergies.length ? ctx.patient.allergies.map((a) => <Badge key={a.id} tone="red">{a.substance} ({a.severity})</Badge>) : <Badge tone="green">Sin alergias conocidas</Badge>}
              {ctx.patient.riskFlags.map((r) => <Badge key={r} tone="amber">Riesgo: {r}</Badge>)}
            </div>
          </div>

          <div className="section-card p-3">
            <Row label="Sexo" value={ctx.patient.sex === "M" ? "Masculino" : "Femenino"} />
            <Row label="Grupo sanguíneo" value={ctx.patient.bloodType ?? "—"} />
            <Row label="Fecha de nacimiento" value={formatDate(ctx.patient.birthDate)} />
            <Row label="EPS" value={ctx.patient.eps} />
            <Row label="Plan" value={ctx.patient.plan ?? "—"} />
            <Row label="Teléfono" value={ctx.patient.phone} />
            <Row label="Ciudad" value={`${ctx.patient.city}, ${ctx.patient.department}`} />
            <Row label="Contacto de emergencia" value={`${ctx.patient.emergencyContact.name} (${ctx.patient.emergencyContact.relationship})`} />
            <Row label="Estado de código" value={ctx.patient.codeStatus === "dnr" ? "No reanimar" : "Reanimación completa"} />
          </div>

          <div>
            <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">Encuentros</h4>
            <div className="space-y-1.5">
              {ctx.encounters.map((e) => (
                <div key={e.id} className="rounded-md border border-ink-200 px-3 py-2 text-xs">
                  <div className="flex justify-between">
                    <span className="font-medium text-ink-800">{e.type} · {e.reason}</span>
                    <span className="text-ink-400">{formatDateTime(e.startedAt)}</span>
                  </div>
                  {e.bed && <span className="text-ink-500">{e.ward} · {e.bed}</span>}
                </div>
              ))}
              {ctx.encounters.length === 0 && <p className="text-xs text-ink-400">Sin encuentros registrados.</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="section-card p-3">
              <p className="font-semibold text-ink-700">Medicamentos activos</p>
              <p className="mt-1 text-2xl font-semibold text-clinical-700">{ctx.meds.filter((m) => m.source === "active").length}</p>
            </div>
            <div className="section-card p-3">
              <p className="font-semibold text-ink-700">Laboratorios</p>
              <p className="mt-1 text-2xl font-semibold text-clinical-700">{ctx.labs.length}</p>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}
