import "./globals.css";
import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell/AppShell";

export const metadata: Metadata = {
  title: "Miracle Hospital HIS Simulator",
  description:
    "Simulador hospitalario HIS/EHR con datos sintéticos para pruebas de automatización de interfaz (Miracle). No es software clínico certificado.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
