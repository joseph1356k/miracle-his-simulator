import {
  Activity,
  AlertTriangle,
  Ambulance,
  BedDouble,
  Boxes,
  ClipboardList,
  CreditCard,
  FileText,
  FlaskConical,
  HeartPulse,
  Home,
  Inbox,
  LayoutDashboard,
  Microscope,
  Network,
  Pill,
  Radiation,
  ScanLine,
  Scissors,
  Settings,
  ShieldCheck,
  Stethoscope,
  TestTubes,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ModuleKey } from "@/lib/types";

export interface NavItem {
  key: ModuleKey;
  label: string;
  href: string;
  testId: string;
  icon: LucideIcon;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "General",
    items: [
      { key: "dashboard", label: "Inicio", href: "/dashboard", testId: "nav-dashboard", icon: LayoutDashboard },
      { key: "clinical-inbox", label: "Bandeja clínica", href: "/clinical-inbox", testId: "nav-clinical-inbox", icon: Inbox },
      { key: "patients", label: "Pacientes", href: "/patients", testId: "nav-patients", icon: Users },
      { key: "admissions", label: "Admisiones", href: "/admissions", testId: "nav-admissions", icon: ClipboardList },
    ],
  },
  {
    title: "Atención",
    items: [
      { key: "emergency", label: "Urgencias", href: "/emergency", testId: "nav-emergency", icon: Ambulance },
      { key: "outpatient", label: "Consulta externa", href: "/outpatient", testId: "nav-outpatient", icon: Stethoscope },
      { key: "inpatient", label: "Hospitalización", href: "/inpatient", testId: "nav-inpatient", icon: BedDouble },
      { key: "icu", label: "UCI", href: "/icu", testId: "nav-icu", icon: HeartPulse },
      { key: "nursing", label: "Enfermería", href: "/nursing", testId: "nav-nursing", icon: Activity },
      { key: "surgery", label: "Cirugía", href: "/surgery", testId: "nav-surgery", icon: Scissors },
    ],
  },
  {
    title: "Clínico",
    items: [
      { key: "documentation", label: "Documentación", href: "/documentation", testId: "nav-documentation", icon: FileText },
      { key: "orders", label: "Órdenes médicas", href: "/orders", testId: "nav-orders", icon: ClipboardList },
      { key: "lab", label: "Laboratorio", href: "/lab", testId: "nav-lab", icon: FlaskConical },
      { key: "imaging", label: "Imágenes diagnósticas", href: "/imaging", testId: "nav-imaging", icon: ScanLine },
      { key: "pharmacy", label: "Farmacia", href: "/pharmacy", testId: "nav-pharmacy", icon: Pill },
      { key: "medications", label: "Medicamentos", href: "/medications", testId: "nav-medications", icon: TestTubes },
      { key: "referrals", label: "Remisiones", href: "/referrals", testId: "nav-referrals", icon: Network },
      { key: "discharge", label: "Egresos / Epicrisis", href: "/discharge", testId: "nav-discharge", icon: Home },
    ],
  },
  {
    title: "Administración",
    items: [
      { key: "billing", label: "Facturación", href: "/billing", testId: "nav-billing", icon: CreditCard },
      { key: "inventory", label: "Inventario clínico", href: "/inventory", testId: "nav-inventory", icon: Boxes },
      { key: "reports", label: "Reportes BI", href: "/reports", testId: "nav-reports", icon: Microscope },
      { key: "audit", label: "Auditoría", href: "/audit", testId: "nav-audit", icon: ShieldCheck },
      { key: "interoperability", label: "Interoperabilidad", href: "/interoperability", testId: "nav-interoperability", icon: Radiation },
      { key: "settings", label: "Configuración", href: "/settings", testId: "nav-settings", icon: Settings },
    ],
  },
  {
    title: "Miracle",
    items: [
      { key: "miracle-test-lab", label: "Miracle Test Lab", href: "/miracle-test-lab", testId: "nav-miracle-test-lab", icon: AlertTriangle },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

/** Resolve the active module for a given pathname (longest-prefix match). */
export function moduleForPath(pathname: string): ModuleKey | undefined {
  const match = ALL_NAV_ITEMS.filter((i) => pathname.startsWith(i.href)).sort(
    (a, b) => b.href.length - a.href.length,
  )[0];
  return match?.key;
}
