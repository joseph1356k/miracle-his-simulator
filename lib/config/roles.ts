import type { ModuleKey, Role, RoleId } from "@/lib/types";

/**
 * Simulated role-based access. This is NOT real security — it only changes
 * which modules and actions the UI exposes, so Miracle can be tested against
 * role-scoped surfaces.
 */
export const ROLES: Role[] = [
  {
    id: "emergency-physician",
    label: "Médico urgencias",
    shortLabel: "Urgencias",
    description: "Atiende pacientes en el servicio de urgencias.",
    modules: [
      "dashboard", "clinical-inbox", "patients", "emergency", "documentation",
      "orders", "lab", "imaging", "medications", "nursing", "referrals",
      "discharge", "interoperability", "audit", "miracle-test-lab",
    ],
    canSignNotes: true,
    canPrescribe: true,
    canAdminister: false,
    canBill: false,
  },
  {
    id: "inpatient-physician",
    label: "Médico hospitalización",
    shortLabel: "Hospitalización",
    description: "Gestiona pacientes hospitalizados y en UCI.",
    modules: [
      "dashboard", "clinical-inbox", "patients", "inpatient", "icu",
      "documentation", "orders", "lab", "imaging", "medications", "nursing",
      "referrals", "surgery", "discharge", "interoperability", "audit",
      "miracle-test-lab",
    ],
    canSignNotes: true,
    canPrescribe: true,
    canAdminister: false,
    canBill: false,
  },
  {
    id: "specialist",
    label: "Especialista",
    shortLabel: "Especialista",
    description: "Atiende consulta externa e interconsultas.",
    modules: [
      "dashboard", "clinical-inbox", "patients", "outpatient", "documentation",
      "orders", "lab", "imaging", "medications", "referrals", "audit",
      "miracle-test-lab",
    ],
    canSignNotes: true,
    canPrescribe: true,
    canAdminister: false,
    canBill: false,
  },
  {
    id: "nurse",
    label: "Enfermería",
    shortLabel: "Enfermería",
    description: "Registra signos vitales, notas y administración.",
    modules: [
      "dashboard", "clinical-inbox", "patients", "nursing", "inpatient", "icu",
      "emergency", "medications", "documentation", "orders", "audit",
      "miracle-test-lab",
    ],
    canSignNotes: false,
    canPrescribe: false,
    canAdminister: true,
    canBill: false,
  },
  {
    id: "nurse-aide",
    label: "Auxiliar de enfermería",
    shortLabel: "Auxiliar enf.",
    description: "Apoya tareas de enfermería y toma de signos.",
    modules: [
      "dashboard", "patients", "nursing", "inpatient", "medications", "audit",
      "miracle-test-lab",
    ],
    canSignNotes: false,
    canPrescribe: false,
    canAdminister: true,
    canBill: false,
  },
  {
    id: "admissions",
    label: "Admisiones",
    shortLabel: "Admisiones",
    description: "Registra pacientes y gestiona ingresos.",
    modules: [
      "dashboard", "patients", "admissions", "billing", "referrals", "audit",
      "miracle-test-lab",
    ],
    canSignNotes: false,
    canPrescribe: false,
    canAdminister: false,
    canBill: true,
  },
  {
    id: "lab",
    label: "Laboratorio",
    shortLabel: "Laboratorio",
    description: "Procesa muestras y registra resultados.",
    modules: [
      "dashboard", "lab", "orders", "patients", "audit", "miracle-test-lab",
    ],
    canSignNotes: false,
    canPrescribe: false,
    canAdminister: false,
    canBill: false,
  },
  {
    id: "radiology",
    label: "Radiología",
    shortLabel: "Radiología",
    description: "Gestiona estudios e informes de imágenes.",
    modules: [
      "dashboard", "imaging", "orders", "patients", "audit", "miracle-test-lab",
    ],
    canSignNotes: true,
    canPrescribe: false,
    canAdminister: false,
    canBill: false,
  },
  {
    id: "pharmacy",
    label: "Farmacia",
    shortLabel: "Farmacia",
    description: "Valida y dispensa medicamentos.",
    modules: [
      "dashboard", "pharmacy", "medications", "inventory", "orders", "patients",
      "audit", "miracle-test-lab",
    ],
    canSignNotes: false,
    canPrescribe: false,
    canAdminister: false,
    canBill: false,
  },
  {
    id: "surgery",
    label: "Cirugía",
    shortLabel: "Cirugía",
    description: "Programa y documenta procedimientos quirúrgicos.",
    modules: [
      "dashboard", "surgery", "patients", "orders", "documentation", "inpatient",
      "audit", "miracle-test-lab",
    ],
    canSignNotes: true,
    canPrescribe: true,
    canAdminister: false,
    canBill: false,
  },
  {
    id: "billing",
    label: "Facturación",
    shortLabel: "Facturación",
    description: "Gestiona autorizaciones EPS y facturas.",
    modules: [
      "dashboard", "billing", "admissions", "patients", "reports", "audit",
      "miracle-test-lab",
    ],
    canSignNotes: false,
    canPrescribe: false,
    canAdminister: false,
    canBill: true,
  },
  {
    id: "clinical-auditor",
    label: "Auditor clínico",
    shortLabel: "Auditor",
    description: "Audita documentación y trazabilidad clínica.",
    modules: [
      "dashboard", "audit", "patients", "reports", "documentation",
      "interoperability", "miracle-test-lab",
    ],
    canSignNotes: false,
    canPrescribe: false,
    canAdminister: false,
    canBill: false,
  },
  {
    id: "it-admin",
    label: "Administrador TI",
    shortLabel: "Admin TI",
    description: "Acceso completo de configuración y administración.",
    modules: "*",
    canSignNotes: true,
    canPrescribe: true,
    canAdminister: true,
    canBill: true,
  },
  {
    id: "miracle-qa",
    label: "Miracle QA Tester",
    shortLabel: "Miracle QA",
    description: "Acceso total para pruebas de automatización Miracle.",
    modules: "*",
    canSignNotes: true,
    canPrescribe: true,
    canAdminister: true,
    canBill: true,
  },
];

export const ROLE_MAP: Record<RoleId, Role> = ROLES.reduce(
  (acc, r) => ({ ...acc, [r.id]: r }),
  {} as Record<RoleId, Role>,
);

export function roleCanSee(role: Role, moduleKey: ModuleKey): boolean {
  if (role.modules === "*") return true;
  return role.modules.includes(moduleKey);
}
