/**
 * Form stress-test matrix: the same/similar labels intentionally appear in
 * multiple modules. Miracle must use context, not just text matching, to pick
 * the correct field. Routes + testids below are real, navigable targets.
 */
export interface StressPlace {
  context: string;
  route: string;
  testId: string;
}
export interface StressGroup {
  label: string;
  places: StressPlace[];
}

export const STRESS_TEST_LABELS: StressGroup[] = [
  {
    label: "Observaciones",
    places: [
      { context: "Triage de enfermería", route: "/emergency/triage", testId: "field-triage-observations" },
      { context: "Nota de enfermería", route: "/nursing/notes", testId: "field-nursing-observations" },
      { context: "Comentarios de signos vitales", route: "/nursing/vitals", testId: "field-vital-comments" },
      { context: "Observaciones administrativas (admisión)", route: "/admissions", testId: "field-admin-observations" },
    ],
  },
  {
    label: "Diagnóstico",
    places: [
      { context: "Impresión diagnóstica (urgencias)", route: "/emergency/encounter/[id]", testId: "field-diagnostic-impression" },
      { context: "Diagnóstico CIE-10 (urgencias)", route: "/emergency/encounter/[id]", testId: "field-diagnosis" },
      { context: "Diagnóstico CIE-10 (consulta externa)", route: "/outpatient/consultation/[id]", testId: "field-diagnosis" },
      { context: "Diagnóstico de ingreso (epicrisis)", route: "/discharge", testId: "field-epicrisis-admission-diagnosis" },
      { context: "Diagnóstico de egreso (epicrisis)", route: "/discharge", testId: "field-epicrisis-discharge-diagnosis" },
      { context: "Diagnóstico preoperatorio (cirugía)", route: "/surgery/case/[id]", testId: "field-op-preop-diagnosis" },
    ],
  },
  {
    label: "Plan",
    places: [
      { context: "Plan (SOAP / consulta)", route: "/outpatient/consultation/[id]", testId: "field-plan" },
      { context: "Plan (nota de urgencias)", route: "/emergency/encounter/[id]", testId: "field-plan" },
      { context: "Plan de cuidado (enfermería)", route: "/nursing/notes", testId: "field-care-plan" },
      { context: "Plan de egreso (hospitalización)", route: "/inpatient/encounter/[id]", testId: "field-discharge-plan" },
      { context: "Plan postoperatorio (cirugía)", route: "/surgery/case/[id]", testId: "field-op-postop-plan" },
      { context: "Plan de seguimiento (consulta)", route: "/outpatient/consultation/[id]", testId: "field-followup-plan" },
    ],
  },
  {
    label: "Medicamentos",
    places: [
      { context: "Medicamentos en casa (conciliación)", route: "/medications", testId: "field-home-medications" },
      { context: "Medicamentos hospitalarios (conciliación)", route: "/medications", testId: "field-active-medications" },
      { context: "Medicamentos habituales (urgencias)", route: "/emergency/encounter/[id]", testId: "field-home-medications" },
      { context: "Medicamentos formulados hoy (consulta)", route: "/outpatient/consultation/[id]", testId: "field-prescribed-medications" },
      { context: "Medicamentos de salida (epicrisis)", route: "/discharge", testId: "field-epicrisis-medications" },
    ],
  },
  {
    label: "Alergias vs. reacciones",
    places: [
      { context: "Alergias (triage)", route: "/emergency/triage", testId: "field-allergies" },
      { context: "Alergias (nota de urgencias)", route: "/emergency/encounter/[id]", testId: "field-allergies" },
      { context: "Medicamentos actuales (≠ alergias)", route: "/emergency/triage", testId: "field-triage-current-medications" },
    ],
  },
  {
    label: "Órdenes solicitadas vs. resultados",
    places: [
      { context: "Órdenes de laboratorio (solicitud)", route: "/orders/new", testId: "field-lab-orders" },
      { context: "Resultados de laboratorio (recibidos)", route: "/lab/results", testId: "lab-result-value-0" },
      { context: "Orden de imágenes (solicitud)", route: "/orders/new", testId: "field-imaging-orders" },
      { context: "Informe de imágenes (hallazgos)", route: "/imaging/reports", testId: "field-imaging-findings" },
    ],
  },
];
