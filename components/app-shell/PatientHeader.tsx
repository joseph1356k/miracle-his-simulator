"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { AlertOctagon, Bed, Droplet, HeartPulse, ShieldAlert, Stethoscope, UserRound, X, PanelRightOpen } from "lucide-react";
import { useSession } from "@/lib/store/useSession";
import { useHospital } from "@/lib/store/useHospital";
import { useUI } from "@/lib/store/useUI";
import { ageFromBirthDate, fullName } from "@/lib/utils/format";
import { Badge } from "@/components/ui/Badge";
import { encounterStatusMeta } from "@/lib/utils/status";

const ENCOUNTER_LABEL: Record<string, string> = {
  emergency: "Urgencias",
  outpatient: "Consulta externa",
  inpatient: "Hospitalización",
  icu: "UCI",
  surgery: "Cirugía",
};

const ISOLATION_LABEL: Record<string, string> = {
  contacto: "Aislamiento contacto",
  gotas: "Aislamiento gotas",
  aereo: "Aislamiento aéreo",
  protector: "Aislamiento protector",
};

export function PatientHeader() {
  const pathname = usePathname();
  const { selectedPatientId, selectedEncounterId, selectEncounter, clearSelection } = useSession();
  const data = useHospital((s) => s.data);
  const setPatientDrawer = useUI((s) => s.setPatientDrawer);

  const ctx = useMemo(() => {
    if (!selectedPatientId) return null;
    const patient = data.patients.find((p) => p.id === selectedPatientId);
    if (!patient) return null;
    const encounters = data.encounters.filter((e) => e.patientId === patient.id);
    const encounter =
      encounters.find((e) => e.id === selectedEncounterId) ??
      encounters.find((e) => e.status === "admitted" || e.status === "in-progress" || e.status === "observation" || e.status === "waiting") ??
      encounters[0];
    const lastVitals = data.vitals
      .filter((v) => v.encounterId === encounter?.id)
      .sort((a, b) => (a.recordedAt < b.recordedAt ? 1 : -1))[0];
    const dxs = (encounter?.diagnoses ?? [])
      .map((id) => data.diagnoses.find((d) => d.id === id))
      .filter(Boolean)
      .slice(0, 3);
    return { patient, encounter, lastVitals, dxs };
  }, [selectedPatientId, selectedEncounterId, data]);

  // Registering a NEW patient: showing the previously selected one would mix two people on screen.
  if (!ctx || pathname.startsWith("/patients/new")) return null;
  const { patient, encounter, lastVitals, dxs } = ctx;

  return (
    <div className="sticky top-14 z-20 border-b border-ink-200 bg-white" data-testid="patient-context-header">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-2 px-4 py-2.5 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-clinical-100 text-clinical-700">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-ink-900" data-testid="patient-name">{fullName(patient)}</h2>
                {encounter && (
                  <Badge tone={encounterStatusMeta(encounter.status).tone} dot>
                    {ENCOUNTER_LABEL[encounter.type]} · {encounterStatusMeta(encounter.status).label}
                  </Badge>
                )}
              </div>
              <p className="text-2xs text-ink-500">
                {ageFromBirthDate(patient.birthDate)} años · {patient.sex === "M" ? "Masculino" : patient.sex === "F" ? "Femenino" : "Otro"} · {patient.documentType} {patient.documentNumber} · HC {patient.recordNumber}
              </p>
              {/* One text node, "Documento: N": the form automation agents read as the record's identity. */}
              <p className="text-2xs font-medium text-ink-600" data-testid="patient-document">{`Documento: ${patient.documentNumber}`}</p>
            </div>
          </div>

          <div className="hidden items-center gap-1.5 text-2xs text-ink-600 lg:flex">
            <Droplet className="h-3.5 w-3.5 text-rose-500" />
            <span className="font-medium">{patient.bloodType ?? "—"}</span>
          </div>

          {encounter?.bed && (
            <div className="hidden items-center gap-1.5 text-2xs text-ink-600 lg:flex">
              <Bed className="h-3.5 w-3.5 text-ink-400" />
              <span>{encounter.ward} · {encounter.bed}</span>
            </div>
          )}

          {encounter?.attendingPhysician && (
            <div className="hidden items-center gap-1.5 text-2xs text-ink-600 lg:flex">
              <Stethoscope className="h-3.5 w-3.5 text-ink-400" />
              <span>{encounter.attendingPhysician}</span>
            </div>
          )}

          <div className="hidden items-center gap-1.5 text-2xs text-ink-600 xl:flex">
            <span className="rounded bg-ink-100 px-1.5 py-0.5">{patient.eps}</span>
          </div>

          {lastVitals && (
            <div className="hidden items-center gap-1.5 text-2xs text-ink-600 xl:flex" data-testid="patient-last-vitals">
              <HeartPulse className="h-3.5 w-3.5 text-emerald-500" />
              <span>TA {lastVitals.systolic}/{lastVitals.diastolic} · FC {lastVitals.heartRate} · SatO₂ {lastVitals.spo2}%</span>
            </div>
          )}

          <div className="ml-auto flex items-center gap-1.5">
            {encounter && (
              <select
                aria-label="Encuentro activo"
                data-testid="encounter-selector"
                value={encounter.id}
                onChange={(e) => selectEncounter(e.target.value)}
                className="h-7 max-w-[180px] rounded-md border border-ink-200 bg-white px-1.5 text-2xs text-ink-600 focus-ring"
              >
                {data.encounters.filter((e) => e.patientId === patient.id).map((e) => (
                  <option key={e.id} value={e.id}>{ENCOUNTER_LABEL[e.type]} · {e.id}</option>
                ))}
              </select>
            )}
            <button onClick={() => setPatientDrawer(true)} className="flex items-center gap-1 rounded-md border border-ink-200 px-2 py-1 text-2xs text-ink-600 hover:bg-ink-50" data-testid="button-patient-summary">
              <PanelRightOpen className="h-3.5 w-3.5" /> Resumen
            </button>
            <button onClick={clearSelection} className="rounded-md p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700" aria-label="Quitar paciente del contexto" data-testid="button-clear-patient">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Risk + diagnosis chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {patient.allergies.length > 0 ? (
            <Badge tone="red" data-testid="patient-allergies">
              <AlertOctagon className="h-3 w-3" /> Alergias: {patient.allergies.map((a) => a.substance).join(", ")}
            </Badge>
          ) : (
            <Badge tone="green" data-testid="patient-allergies">Sin alergias conocidas</Badge>
          )}
          {patient.codeStatus === "dnr" && <Badge tone="purple">Orden de no reanimar</Badge>}
          {patient.isolation !== "none" && (
            <Badge tone="amber"><ShieldAlert className="h-3 w-3" /> {ISOLATION_LABEL[patient.isolation]}</Badge>
          )}
          {patient.riskFlags.map((r) => (
            <Badge key={r} tone="amber">Riesgo: {r}</Badge>
          ))}
          {dxs.map((d) => (
            <Badge key={d!.id} tone="blue">{d!.code} · {d!.label}</Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
