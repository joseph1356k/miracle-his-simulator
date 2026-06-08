"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { buildSeed } from "@/lib/data/seed";
import { genId } from "@/lib/utils/id";
import { nowIso } from "@/lib/utils/format";
import { useSession } from "@/lib/store/useSession";
import type {
  AuditEvent,
  Authorization,
  ClinicalNote,
  Diagnosis,
  Encounter,
  EncounterStatus,
  HospitalDataset,
  ImagingOrder,
  ImagingReport,
  LabOrder,
  LabResultItem,
  LabStatus,
  MedicationOrder,
  NursingTask,
  Order,
  OrderStatus,
  Patient,
  Referral,
  SurgeryCase,
  VitalSigns,
} from "@/lib/types";

const SCHEMA_VERSION = 3;

function emptyDataset(): HospitalDataset {
  return {
    patients: [], encounters: [], vitals: [], diagnoses: [], notes: [],
    orders: [], medications: [], labs: [], imaging: [], nursingTasks: [],
    surgeries: [], referrals: [], authorizations: [], billing: [],
    inventory: [], audit: [],
  };
}

/** Build an audit event from the live session + a partial payload. */
function makeAudit(partial: Partial<AuditEvent> & { action: string; entity: string; module: string }): AuditEvent {
  const s = useSession.getState();
  return {
    id: genId("aud"),
    timestamp: nowIso(),
    actor: s.userName,
    actorRole: s.roleId,
    session: "sess-live",
    device: "Miracle Test Workstation",
    patientId: partial.patientId,
    encounterId: partial.encounterId,
    field: partial.field,
    previousValue: partial.previousValue,
    newValue: partial.newValue,
    action: partial.action,
    entity: partial.entity,
    module: partial.module,
  };
}

interface HospitalState {
  version: number;
  data: HospitalDataset;
  seedIfEmpty: () => void;
  resetData: () => void;
  pushAudit: (partial: Partial<AuditEvent> & { action: string; entity: string; module: string }) => void;

  addPatient: (p: Patient) => void;
  addEncounter: (e: Encounter) => void;
  setEncounterStatus: (id: string, status: EncounterStatus) => void;
  addAuthorization: (a: Authorization) => void;
  setSurgeryStatus: (id: string, status: SurgeryCase["status"]) => void;

  addNote: (note: ClinicalNote) => void;
  updateNoteSection: (id: string, key: string, value: string) => void;
  updateNoteBody: (id: string, body: string) => void;
  signNote: (id: string) => void;

  addVitals: (v: VitalSigns) => void;
  addDiagnosis: (d: Diagnosis) => void;
  removeDiagnosis: (id: string) => void;

  addOrder: (o: Order) => void;
  setOrderStatus: (id: string, status: OrderStatus) => void;

  addMedication: (m: MedicationOrder) => void;
  setMedValidation: (id: string, status: MedicationOrder["validationStatus"]) => void;
  administerMar: (medId: string, marId: string) => void;
  omitMar: (medId: string, marId: string, reason: string) => void;

  setLabStatus: (id: string, status: LabStatus) => void;
  enterLabResults: (id: string, results: LabResultItem[]) => void;
  acknowledgeLab: (id: string) => void;

  setImagingStatus: (id: string, status: ImagingOrder["status"]) => void;
  saveImagingReport: (id: string, report: ImagingReport) => void;

  setNursingTaskStatus: (id: string, status: NursingTask["status"]) => void;
  addNursingTask: (t: NursingTask) => void;

  addReferral: (r: Referral) => void;
  setReferralStatus: (id: string, status: Referral["status"], response?: string) => void;

  setAuthStatus: (id: string, status: Authorization["status"]) => void;
}

export const useHospital = create<HospitalState>()(
  persist(
    (set, get) => ({
      version: SCHEMA_VERSION,
      data: emptyDataset(),

      seedIfEmpty: () => {
        if (get().data.patients.length === 0) {
          set({ data: buildSeed(), version: SCHEMA_VERSION });
        }
      },
      resetData: () => set({ data: buildSeed(), version: SCHEMA_VERSION }),

      pushAudit: (partial) =>
        set((st) => ({ data: { ...st.data, audit: [makeAudit(partial), ...st.data.audit] } })),

      addPatient: (p) =>
        set((st) => ({
          data: {
            ...st.data,
            patients: [p, ...st.data.patients],
            audit: [makeAudit({ action: "create", entity: "Patient", module: "patient-registration", patientId: p.id, newValue: `${p.firstName} ${p.lastName}` }), ...st.data.audit],
          },
        })),

      addEncounter: (e) =>
        set((st) => ({
          data: {
            ...st.data,
            encounters: [e, ...st.data.encounters],
            audit: [makeAudit({ action: "create", entity: "Encounter", module: "admissions", patientId: e.patientId, encounterId: e.id, newValue: `${e.type} · ${e.reason}` }), ...st.data.audit],
          },
        })),

      setEncounterStatus: (id, status) =>
        set((st) => {
          const e = st.data.encounters.find((x) => x.id === id);
          return {
            data: {
              ...st.data,
              encounters: st.data.encounters.map((x) => (x.id === id ? { ...x, status, endedAt: status === "discharged" ? nowIso() : x.endedAt } : x)),
              audit: [makeAudit({ action: "update", entity: "Encounter", module: "inpatient", patientId: e?.patientId, encounterId: id, field: "status", previousValue: e?.status, newValue: status }), ...st.data.audit],
            },
          };
        }),

      addAuthorization: (a) =>
        set((st) => ({
          data: {
            ...st.data,
            authorizations: [a, ...st.data.authorizations],
            audit: [makeAudit({ action: "create", entity: "Authorization", module: "billing", patientId: a.patientId, encounterId: a.encounterId, newValue: a.service }), ...st.data.audit],
          },
        })),

      setSurgeryStatus: (id, status) =>
        set((st) => {
          const sc = st.data.surgeries.find((x) => x.id === id);
          return {
            data: {
              ...st.data,
              surgeries: st.data.surgeries.map((x) => (x.id === id ? { ...x, status } : x)),
              audit: [makeAudit({ action: "update", entity: "SurgeryCase", module: "surgery", patientId: sc?.patientId, encounterId: sc?.encounterId, field: "status", previousValue: sc?.status, newValue: status }), ...st.data.audit],
            },
          };
        }),

      addNote: (note) =>
        set((st) => ({
          data: {
            ...st.data,
            notes: [note, ...st.data.notes],
            audit: [makeAudit({ action: "create", entity: "ClinicalNote", module: "documentation", patientId: note.patientId, encounterId: note.encounterId, newValue: note.title }), ...st.data.audit],
          },
        })),

      updateNoteSection: (id, key, value) =>
        set((st) => ({
          data: {
            ...st.data,
            notes: st.data.notes.map((n) =>
              n.id === id ? { ...n, sections: { ...(n.sections ?? {}), [key]: value } } : n,
            ),
          },
        })),

      updateNoteBody: (id, body) =>
        set((st) => ({
          data: { ...st.data, notes: st.data.notes.map((n) => (n.id === id ? { ...n, body } : n)) },
        })),

      signNote: (id) =>
        set((st) => {
          const note = st.data.notes.find((n) => n.id === id);
          return {
            data: {
              ...st.data,
              notes: st.data.notes.map((n) => (n.id === id ? { ...n, status: "signed", signedAt: nowIso() } : n)),
              audit: [makeAudit({ action: "sign", entity: "ClinicalNote", module: "documentation", patientId: note?.patientId, encounterId: note?.encounterId, newValue: "Nota firmada" }), ...st.data.audit],
            },
          };
        }),

      addVitals: (v) =>
        set((st) => ({
          data: {
            ...st.data,
            vitals: [v, ...st.data.vitals],
            audit: [makeAudit({ action: "create", entity: "VitalSigns", module: "nursing", patientId: v.patientId, encounterId: v.encounterId, newValue: `TA ${v.systolic}/${v.diastolic}, FC ${v.heartRate}` }), ...st.data.audit],
          },
        })),

      addDiagnosis: (d) =>
        set((st) => ({
          data: {
            ...st.data,
            diagnoses: [d, ...st.data.diagnoses],
            encounters: st.data.encounters.map((e) => (e.id === d.encounterId ? { ...e, diagnoses: [...e.diagnoses, d.id] } : e)),
            audit: [makeAudit({ action: "create", entity: "Diagnosis", module: "documentation", patientId: d.patientId, encounterId: d.encounterId, newValue: `${d.code} ${d.label}` }), ...st.data.audit],
          },
        })),

      removeDiagnosis: (id) =>
        set((st) => ({
          data: {
            ...st.data,
            diagnoses: st.data.diagnoses.filter((d) => d.id !== id),
            encounters: st.data.encounters.map((e) => ({ ...e, diagnoses: e.diagnoses.filter((x) => x !== id) })),
          },
        })),

      addOrder: (o) =>
        set((st) => ({
          data: {
            ...st.data,
            orders: [o, ...st.data.orders],
            audit: [makeAudit({ action: o.status === "signed" ? "sign" : "create", entity: "Order", module: "orders", patientId: o.patientId, encounterId: o.encounterId, newValue: `${o.category}: ${o.name}` }), ...st.data.audit],
          },
        })),

      setOrderStatus: (id, status) =>
        set((st) => {
          const o = st.data.orders.find((x) => x.id === id);
          return {
            data: {
              ...st.data,
              orders: st.data.orders.map((x) => (x.id === id ? { ...x, status, signedAt: status === "signed" ? nowIso() : x.signedAt } : x)),
              audit: [makeAudit({ action: status === "signed" ? "sign" : "update", entity: "Order", module: "orders", patientId: o?.patientId, encounterId: o?.encounterId, field: "status", previousValue: o?.status, newValue: status }), ...st.data.audit],
            },
          };
        }),

      addMedication: (m) =>
        set((st) => ({
          data: {
            ...st.data,
            medications: [m, ...st.data.medications],
            audit: [makeAudit({ action: "create", entity: "MedicationOrder", module: "medications", patientId: m.patientId, encounterId: m.encounterId, newValue: `${m.medicationName} ${m.dose}${m.unit}` }), ...st.data.audit],
          },
        })),

      setMedValidation: (id, status) =>
        set((st) => {
          const m = st.data.medications.find((x) => x.id === id);
          return {
            data: {
              ...st.data,
              medications: st.data.medications.map((x) => (x.id === id ? { ...x, validationStatus: status } : x)),
              audit: [makeAudit({ action: "validate", entity: "MedicationOrder", module: "pharmacy", patientId: m?.patientId, encounterId: m?.encounterId, field: "validationStatus", newValue: status }), ...st.data.audit],
            },
          };
        }),

      administerMar: (medId, marId) =>
        set((st) => {
          const actor = useSession.getState().userName;
          const m = st.data.medications.find((x) => x.id === medId);
          return {
            data: {
              ...st.data,
              medications: st.data.medications.map((x) =>
                x.id === medId
                  ? { ...x, schedule: x.schedule.map((e) => (e.id === marId ? { ...e, status: "administered", administeredBy: actor } : e)) }
                  : x,
              ),
              audit: [makeAudit({ action: "administer", entity: "MedicationOrder", module: "medications", patientId: m?.patientId, encounterId: m?.encounterId, newValue: `Administrado ${m?.medicationName}` }), ...st.data.audit],
            },
          };
        }),

      omitMar: (medId, marId, reason) =>
        set((st) => {
          const m = st.data.medications.find((x) => x.id === medId);
          return {
            data: {
              ...st.data,
              medications: st.data.medications.map((x) =>
                x.id === medId
                  ? { ...x, schedule: x.schedule.map((e) => (e.id === marId ? { ...e, status: "omitted", omittedReason: reason } : e)) }
                  : x,
              ),
              audit: [makeAudit({ action: "update", entity: "MedicationOrder", module: "medications", patientId: m?.patientId, encounterId: m?.encounterId, field: "marStatus", newValue: `Omitido: ${reason}` }), ...st.data.audit],
            },
          };
        }),

      setLabStatus: (id, status) =>
        set((st) => {
          const l = st.data.labs.find((x) => x.id === id);
          return {
            data: {
              ...st.data,
              labs: st.data.labs.map((x) => (x.id === id ? { ...x, status } : x)),
              audit: [makeAudit({ action: "update", entity: "LabOrder", module: "lab", patientId: l?.patientId, encounterId: l?.encounterId, field: "status", previousValue: l?.status, newValue: status }), ...st.data.audit],
            },
          };
        }),

      enterLabResults: (id, results) =>
        set((st) => {
          const l = st.data.labs.find((x) => x.id === id);
          return {
            data: {
              ...st.data,
              labs: st.data.labs.map((x) => (x.id === id ? { ...x, results, status: "resulted", resultTime: nowIso() } : x)),
              audit: [makeAudit({ action: "update", entity: "LabOrder", module: "lab", patientId: l?.patientId, encounterId: l?.encounterId, field: "results", newValue: `Resultados ingresados (${results.length})` }), ...st.data.audit],
            },
          };
        }),

      acknowledgeLab: (id) =>
        set((st) => {
          const l = st.data.labs.find((x) => x.id === id);
          const actor = useSession.getState().userName;
          return {
            data: {
              ...st.data,
              labs: st.data.labs.map((x) => (x.id === id ? { ...x, status: "acknowledged", acknowledgedBy: actor } : x)),
              audit: [makeAudit({ action: "acknowledge", entity: "LabOrder", module: "lab", patientId: l?.patientId, encounterId: l?.encounterId, newValue: "Resultado reconocido" }), ...st.data.audit],
            },
          };
        }),

      setImagingStatus: (id, status) =>
        set((st) => {
          const im = st.data.imaging.find((x) => x.id === id);
          return {
            data: {
              ...st.data,
              imaging: st.data.imaging.map((x) => (x.id === id ? { ...x, status } : x)),
              audit: [makeAudit({ action: "update", entity: "ImagingOrder", module: "imaging", patientId: im?.patientId, encounterId: im?.encounterId, field: "status", previousValue: im?.status, newValue: status }), ...st.data.audit],
            },
          };
        }),

      saveImagingReport: (id, report) =>
        set((st) => {
          const im = st.data.imaging.find((x) => x.id === id);
          return {
            data: {
              ...st.data,
              imaging: st.data.imaging.map((x) => (x.id === id ? { ...x, report, status: report.status } : x)),
              audit: [makeAudit({ action: "update", entity: "ImagingReport", module: "imaging", patientId: im?.patientId, encounterId: im?.encounterId, newValue: `Informe ${report.status}` }), ...st.data.audit],
            },
          };
        }),

      setNursingTaskStatus: (id, status) =>
        set((st) => {
          const t = st.data.nursingTasks.find((x) => x.id === id);
          return {
            data: {
              ...st.data,
              nursingTasks: st.data.nursingTasks.map((x) => (x.id === id ? { ...x, status } : x)),
              audit: [makeAudit({ action: "update", entity: "NursingTask", module: "nursing", patientId: t?.patientId, encounterId: t?.encounterId, field: "status", previousValue: t?.status, newValue: status }), ...st.data.audit],
            },
          };
        }),

      addNursingTask: (t) =>
        set((st) => ({
          data: {
            ...st.data,
            nursingTasks: [t, ...st.data.nursingTasks],
            audit: [makeAudit({ action: "create", entity: "NursingTask", module: "nursing", patientId: t.patientId, encounterId: t.encounterId, newValue: t.type }), ...st.data.audit],
          },
        })),

      addReferral: (r) =>
        set((st) => ({
          data: {
            ...st.data,
            referrals: [r, ...st.data.referrals],
            audit: [makeAudit({ action: "create", entity: "Referral", module: "referrals", patientId: r.patientId, encounterId: r.encounterId, newValue: `${r.kind} ${r.specialty}` }), ...st.data.audit],
          },
        })),

      setReferralStatus: (id, status, response) =>
        set((st) => ({
          data: {
            ...st.data,
            referrals: st.data.referrals.map((x) => (x.id === id ? { ...x, status, response: response ?? x.response } : x)),
          },
        })),

      setAuthStatus: (id, status) =>
        set((st) => {
          const a = st.data.authorizations.find((x) => x.id === id);
          return {
            data: {
              ...st.data,
              authorizations: st.data.authorizations.map((x) => (x.id === id ? { ...x, status } : x)),
              audit: [makeAudit({ action: "update", entity: "Authorization", module: "billing", patientId: a?.patientId, encounterId: a?.encounterId, field: "status", previousValue: a?.status, newValue: status }), ...st.data.audit],
            },
          };
        }),
    }),
    {
      name: "miracle-his-data",
      version: SCHEMA_VERSION,
      migrate: (persisted: any, version) => {
        // On schema change, rebuild the synthetic dataset.
        if (!persisted || version !== SCHEMA_VERSION) {
          return { version: SCHEMA_VERSION, data: emptyDataset() } as any;
        }
        return persisted;
      },
    },
  ),
);
