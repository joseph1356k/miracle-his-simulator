"use client";

import { UserRoundSearch } from "lucide-react";
import { useUI } from "@/lib/store/useUI";
import { useSelected } from "@/lib/hooks/useSelected";
import { Button } from "@/components/ui/Button";
import { ageFromBirthDate, fullName } from "@/lib/utils/format";

/** Shown above clinical forms; prompts for patient selection when none active. */
export function SelectedPatientBanner({ requirement = "registrar en su historia" }: { requirement?: string }) {
  const { patient, encounter } = useSelected();
  const setCommandOpen = useUI((s) => s.setCommandOpen);

  if (!patient) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-clinical-200 bg-clinical-50 px-4 py-2.5" data-testid="no-patient-banner">
        <div className="flex items-center gap-2 text-sm text-clinical-800">
          <UserRoundSearch className="h-4 w-4" />
          Seleccione un paciente para {requirement}.
        </div>
        <Button size="sm" variant="subtle" onClick={() => setCommandOpen(true)} data-testid="banner-select-patient">
          Buscar paciente (Ctrl K)
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm" data-testid="selected-patient-banner">
      <span className="text-ink-700">
        Trabajando sobre <span className="font-semibold text-ink-900">{fullName(patient)}</span>
        <span className="ml-2 text-2xs text-ink-400">{ageFromBirthDate(patient.birthDate)}a · {patient.documentType} {patient.documentNumber}{encounter ? ` · ${encounter.id}` : ""}</span>
      </span>
      <Button size="sm" variant="ghost" onClick={() => setCommandOpen(true)}>Cambiar</Button>
    </div>
  );
}
