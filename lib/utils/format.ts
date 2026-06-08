/** Formatting + small deterministic helpers shared across the simulator. */

const MONTHS_ES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

export function ageFromBirthDate(birthDate: string, now = new Date()): number {
  const d = new Date(birthDate);
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

export function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${formatDate(iso)} · ${time}`;
}

export function formatTime(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function relativeFromNow(iso?: string, now = Date.now()): string {
  if (!iso) return "—";
  const diff = now - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (Math.abs(mins) < 1) return "ahora";
  if (Math.abs(mins) < 60) return `hace ${mins} min`;
  const hours = Math.round(mins / 60);
  if (Math.abs(hours) < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `hace ${days} d`;
}

export function minutesToHuman(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function currencyCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function initials(first: string, last: string): string {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
}

export function fullName(p: { firstName: string; lastName: string }): string {
  return `${p.firstName} ${p.lastName}`.trim();
}

/** ISO timestamp helper so all writes share one clock format. */
export function nowIso(): string {
  return new Date().toISOString();
}

/** Build a testid-safe token from arbitrary (possibly accented) label text. */
export function toTestId(...parts: (string | number | undefined)[]): string {
  return parts
    .filter((p) => p !== undefined && p !== "")
    .join("-")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
