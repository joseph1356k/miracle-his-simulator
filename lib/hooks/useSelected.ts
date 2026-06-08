"use client";

import { useMemo } from "react";
import { useSession } from "@/lib/store/useSession";
import { useHospital } from "@/lib/store/useHospital";
import type { Encounter, Patient } from "@/lib/types";

const ACTIVE_STATUSES = ["admitted", "in-progress", "observation", "waiting"];

/** Resolve the patient + encounter currently in context. */
export function useSelected(): { patient?: Patient; encounter?: Encounter; encounters: Encounter[] } {
  const selectedPatientId = useSession((s) => s.selectedPatientId);
  const selectedEncounterId = useSession((s) => s.selectedEncounterId);
  const data = useHospital((s) => s.data);

  return useMemo(() => {
    const patient = data.patients.find((p) => p.id === selectedPatientId);
    const encounters = data.encounters.filter((e) => e.patientId === selectedPatientId);
    const encounter =
      encounters.find((e) => e.id === selectedEncounterId) ??
      encounters.find((e) => ACTIVE_STATUSES.includes(e.status)) ??
      encounters[0];
    return { patient, encounter, encounters };
  }, [selectedPatientId, selectedEncounterId, data]);
}
