"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RoleId } from "@/lib/types";
import { ROLE_MAP } from "@/lib/config/roles";

/** Fake professional identity per role (synthetic). */
const ROLE_USER: Record<RoleId, string> = {
  "emergency-physician": "Dr. Andrés Restrepo",
  "inpatient-physician": "Dra. Catalina Mejía",
  specialist: "Dr. Felipe Arango",
  nurse: "Enf. Laura Gómez",
  "nurse-aide": "Aux. Sofía Rojas",
  admissions: "Marcela Ortiz",
  lab: "Bact. Lina Gómez",
  radiology: "Dr. Óscar Henao",
  pharmacy: "Q.F. Juliana Patiño",
  surgery: "Dr. Camilo Zapata",
  billing: "Andrés Loaiza",
  "clinical-auditor": "Dra. Paula Velásquez",
  "it-admin": "Soporte TI",
  "miracle-qa": "Miracle QA Tester",
};

interface SessionState {
  roleId: RoleId;
  userName: string;
  shift: string;
  location: string;
  selectedPatientId?: string;
  selectedEncounterId?: string;
  setRole: (id: RoleId) => void;
  setShift: (shift: string) => void;
  setLocation: (location: string) => void;
  selectPatient: (id?: string) => void;
  selectEncounter: (id?: string) => void;
  clearSelection: () => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      roleId: "miracle-qa",
      userName: ROLE_USER["miracle-qa"],
      shift: "Turno mañana (07:00 - 13:00)",
      location: "Hospital Universitario San Rafael — Sede Central",
      selectedPatientId: undefined,
      selectedEncounterId: undefined,
      setRole: (id) => set({ roleId: id, userName: ROLE_USER[id] }),
      setShift: (shift) => set({ shift }),
      setLocation: (location) => set({ location }),
      selectPatient: (id) => set({ selectedPatientId: id, selectedEncounterId: undefined }),
      selectEncounter: (id) => set({ selectedEncounterId: id }),
      clearSelection: () => set({ selectedPatientId: undefined, selectedEncounterId: undefined }),
    }),
    { name: "miracle-his-session" },
  ),
);

export function useCurrentRole() {
  const roleId = useSession((s) => s.roleId);
  return ROLE_MAP[roleId];
}
