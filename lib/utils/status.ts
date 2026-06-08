import type { BadgeTone } from "@/components/ui/Badge";

export interface StatusMeta {
  label: string;
  tone: BadgeTone;
}

const fallback: StatusMeta = { label: "—", tone: "neutral" };

function mapper<T extends string>(map: Record<T, StatusMeta>) {
  return (key: T | string | undefined): StatusMeta => (key ? map[key as T] ?? { label: String(key), tone: "neutral" } : fallback);
}

export const orderStatusMeta = mapper({
  draft: { label: "Borrador", tone: "slate" },
  signed: { label: "Firmada", tone: "blue" },
  sent: { label: "Enviada", tone: "purple" },
  "in-progress": { label: "En proceso", tone: "amber" },
  completed: { label: "Completada", tone: "green" },
  cancelled: { label: "Cancelada", tone: "neutral" },
  rejected: { label: "Rechazada", tone: "red" },
});

export const labStatusMeta = mapper({
  ordered: { label: "Ordenado", tone: "slate" },
  collected: { label: "Tomada muestra", tone: "blue" },
  processing: { label: "Procesando", tone: "amber" },
  resulted: { label: "Resultado", tone: "green" },
  acknowledged: { label: "Reconocido", tone: "teal" },
  cancelled: { label: "Cancelado", tone: "neutral" },
});

export const imagingStatusMeta = mapper({
  ordered: { label: "Ordenado", tone: "slate" },
  scheduled: { label: "Programado", tone: "blue" },
  acquired: { label: "Adquirido", tone: "amber" },
  preliminary: { label: "Preliminar", tone: "purple" },
  final: { label: "Final", tone: "green" },
  cancelled: { label: "Cancelado", tone: "neutral" },
});

export const medValidationMeta = mapper({
  pending: { label: "Pendiente", tone: "amber" },
  validated: { label: "Validado", tone: "green" },
  rejected: { label: "Rechazado", tone: "red" },
});

export const marStatusMeta = mapper({
  pending: { label: "Pendiente", tone: "amber" },
  administered: { label: "Administrado", tone: "green" },
  omitted: { label: "Omitido", tone: "red" },
  held: { label: "En espera", tone: "slate" },
});

export const authStatusMeta = mapper({
  pending: { label: "Pendiente", tone: "amber" },
  approved: { label: "Aprobada", tone: "green" },
  denied: { label: "Negada", tone: "red" },
  "docs-required": { label: "Requiere soportes", tone: "purple" },
});

export const encounterStatusMeta = mapper({
  waiting: { label: "En espera", tone: "amber" },
  "in-progress": { label: "En atención", tone: "blue" },
  observation: { label: "Observación", tone: "purple" },
  admitted: { label: "Hospitalizado", tone: "teal" },
  scheduled: { label: "Programado", tone: "slate" },
  discharged: { label: "Egresado", tone: "green" },
  closed: { label: "Cerrado", tone: "neutral" },
});

export const priorityMeta = mapper({
  rutina: { label: "Rutina", tone: "slate" },
  prioritario: { label: "Prioritario", tone: "blue" },
  urgente: { label: "Urgente", tone: "amber" },
  stat: { label: "STAT", tone: "red" },
});

export const surgeryStatusMeta = mapper({
  scheduled: { label: "Programada", tone: "slate" },
  "pre-op": { label: "Preoperatorio", tone: "blue" },
  "in-progress": { label: "En cirugía", tone: "amber" },
  recovery: { label: "Recuperación", tone: "purple" },
  completed: { label: "Completada", tone: "green" },
  cancelled: { label: "Cancelada", tone: "neutral" },
});

export const taskStatusMeta = mapper({
  pending: { label: "Pendiente", tone: "amber" },
  "in-progress": { label: "En curso", tone: "blue" },
  done: { label: "Realizada", tone: "green" },
  overdue: { label: "Vencida", tone: "red" },
});

export const labFlagMeta = mapper({
  normal: { label: "Normal", tone: "green" },
  alto: { label: "Alto", tone: "amber" },
  bajo: { label: "Bajo", tone: "amber" },
  critico: { label: "Crítico", tone: "red" },
});

export const referralStatusMeta = mapper({
  requested: { label: "Solicitada", tone: "amber" },
  accepted: { label: "Aceptada", tone: "blue" },
  rejected: { label: "Rechazada", tone: "red" },
  answered: { label: "Respondida", tone: "green" },
});

export const triageLevelMeta = (level?: number): StatusMeta => {
  switch (level) {
    case 1: return { label: "Triage 1 · Resucitación", tone: "red" };
    case 2: return { label: "Triage 2 · Emergencia", tone: "red" };
    case 3: return { label: "Triage 3 · Urgencia", tone: "amber" };
    case 4: return { label: "Triage 4 · Menor", tone: "blue" };
    case 5: return { label: "Triage 5 · No urgente", tone: "green" };
    default: return fallback;
  }
};
