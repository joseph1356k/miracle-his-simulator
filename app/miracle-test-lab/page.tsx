"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical, Wand2, Copy, ArrowUpRight, Target, Gauge } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Section, Stat } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useFieldRegistry } from "@/lib/store/useFieldRegistry";
import { useSession } from "@/lib/store/useSession";
import { useUI } from "@/lib/store/useUI";
import { MIRACLE_SCENARIOS } from "@/lib/data/scenarios";
import { STRESS_TEST_LABELS } from "@/lib/data/stress-test";
import { cn } from "@/lib/utils/cn";
import type { MiracleScenario } from "@/lib/types";

type FillState = { value: string; wrongSection?: boolean };

function scoreField(expected: string, fill?: FillState) {
  if (!fill || !fill.value.trim()) return "missing" as const;
  if (fill.wrongSection) return "wrong-section" as const;
  const a = fill.value.toLowerCase().trim();
  const b = expected.toLowerCase().trim();
  if (a === b || b.includes(a.slice(0, 8)) || a.includes(b.slice(0, 8))) return "correct" as const;
  return "incorrect" as const;
}

const STATUS_TONE = { correct: "green", incorrect: "red", missing: "neutral", "wrong-section": "amber" } as const;
const STATUS_LABEL = { correct: "Correcto", incorrect: "Incorrecto", missing: "Faltante", "wrong-section": "Sección incorrecta" } as const;

export default function MiracleTestLabPage() {
  const router = useRouter();
  const selectPatient = useSession((s) => s.selectPatient);
  const addToast = useUI((s) => s.addToast);
  const registry = useFieldRegistry((s) => s.fields);

  const [scenarioId, setScenarioId] = useState(MIRACLE_SCENARIOS[0].id);
  const scenario = useMemo(() => MIRACLE_SCENARIOS.find((s) => s.id === scenarioId)!, [scenarioId]);
  const [transcript, setTranscript] = useState(scenario.transcript);
  const [fills, setFills] = useState<Record<string, FillState>>({});
  const [startedAt, setStartedAt] = useState(Date.now());
  const [interactions, setInteractions] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => { setTranscript(scenario.transcript); setFills({}); setStartedAt(Date.now()); setInteractions(0); setElapsed(0); }, [scenario]);
  useEffect(() => { const t = setInterval(() => setElapsed(Math.round((Date.now() - startedAt) / 1000)), 1000); return () => clearInterval(t); }, [startedAt]);

  const setFill = (key: string, value: string) => { setFills((f) => ({ ...f, [key]: { value } })); setInteractions((i) => i + 1); };

  const autoPerfect = () => {
    const next: Record<string, FillState> = {};
    scenario.expectedFields.forEach((f) => { next[f.key] = { value: f.expected }; });
    setFills(next); setInteractions((i) => i + scenario.expectedFields.length);
    addToast({ title: "Miracle llenó todos los campos (perfecto)", variant: "success" });
  };
  const autoPartial = () => {
    const next: Record<string, FillState> = {};
    scenario.expectedFields.forEach((f) => {
      const roll = Math.random();
      if (roll < 0.62) next[f.key] = { value: f.expected };
      else if (roll < 0.78) next[f.key] = { value: f.expected, wrongSection: true };
      else if (roll < 0.9) next[f.key] = { value: "Valor incorrecto (demo)" };
      // else leave missing
    });
    setFills(next); setInteractions((i) => i + Object.keys(next).length);
    addToast({ title: "Miracle llenó parcialmente (simulación realista)", variant: "info" });
  };

  const metrics = useMemo(() => {
    const results = scenario.expectedFields.map((f) => scoreField(f.expected, fills[f.key]));
    const total = results.length;
    const correct = results.filter((r) => r === "correct").length;
    const incorrect = results.filter((r) => r === "incorrect").length;
    const missing = results.filter((r) => r === "missing").length;
    const wrongSection = results.filter((r) => r === "wrong-section").length;
    const filled = total - missing;
    return { total, correct, incorrect, missing, wrongSection, filled, accuracy: total ? Math.round((correct / total) * 100) : 0 };
  }, [scenario, fills]);

  const openTarget = () => { if (scenario.patientId) selectPatient(scenario.patientId); router.push(scenario.targetRoute); };
  const liveFields = Object.values(registry);
  const copy = (text: string) => { navigator.clipboard?.writeText(text); addToast({ title: "Copiado", description: text, variant: "info" }); };

  return (
    <PageContainer>
      <PageHeader title="Miracle Test Lab" description="Entorno dedicado para probar la automatización de Miracle: transcripción, mapeo de campos y puntuación." icon={<FlaskConical className="h-5 w-5" />}
        actions={<Button onClick={openTarget} data-testid="miracle-open-target"><ArrowUpRight className="h-4 w-4" /> Abrir módulo destino</Button>} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Scenario library */}
        <Section title="Biblioteca de escenarios" testId="section-scenario-library" className="lg:col-span-1">
          <div className="space-y-1.5">
            {MIRACLE_SCENARIOS.map((s) => (
              <button key={s.id} onClick={() => setScenarioId(s.id)} data-testid={`scenario-${s.id}`} className={cn("w-full rounded-md border px-3 py-2 text-left transition", s.id === scenarioId ? "border-clinical-400 bg-clinical-50" : "border-ink-200 hover:bg-ink-50")}>
                <div className="flex items-center justify-between gap-2"><span className="text-sm font-medium text-ink-900">{s.title}</span><DifficultyBadge d={s.difficulty} /></div>
                <span className="text-2xs text-ink-400">{s.category}</span>
              </button>
            ))}
          </div>
        </Section>

        <div className="space-y-4 lg:col-span-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Precisión" value={`${metrics.accuracy}%`} tone={metrics.accuracy >= 80 ? "green" : metrics.accuracy >= 50 ? "amber" : "red"} icon={<Gauge className="h-4 w-4" />} />
            <Stat label="Campos correctos" value={`${metrics.correct}/${metrics.total}`} tone="blue" />
            <Stat label="Interacciones UI" value={interactions} />
            <Stat label="Tiempo" value={`${elapsed}s`} hint="desde carga del escenario" />
          </div>

          <Tabs tabs={[
            { key: "transcript", label: "Transcripción y mapeo", content: (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Section title="A. Simulador de transcripción" testId="section-transcript">
                  <textarea data-testid="miracle-transcript" aria-label="Transcripción de la conversación" value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={12} className="field-input leading-relaxed" />
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="outline" onClick={openTarget}><ArrowUpRight className="h-4 w-4" /> Ir a {scenario.targetRoute}</Button>
                    {scenario.patientId && <Badge tone="blue">Paciente: {scenario.patientId}</Badge>}
                  </div>
                </Section>
                <Section title="B. Mapeo esperado (target)" testId="section-expected-mapping" icon={<Target className="h-4 w-4" />}>
                  <div className="space-y-1.5">
                    {scenario.expectedFields.map((f) => (
                      <div key={f.key} className="rounded-md border border-ink-200 px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-ink-800">{f.label}</span>
                          {f.testId && <button onClick={() => copy(f.testId!)} className="flex items-center gap-1 text-2xs text-clinical-600 hover:underline" data-testid={`copy-${f.testId}`}><Copy className="h-3 w-3" /> {f.testId}</button>}
                        </div>
                        <div className="text-2xs text-ink-400">{f.section} · clave: <code>{f.key}</code></div>
                        <div className="mt-0.5 text-2xs text-ink-600">Esperado: {f.expected}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5 border-t border-ink-100 pt-3 text-2xs">
                    {scenario.expectedDiagnoses.length > 0 && <Badge tone="blue">Dx: {scenario.expectedDiagnoses.join(", ")}</Badge>}
                    {scenario.expectedOrders.length > 0 && <Badge tone="purple">Órdenes: {scenario.expectedOrders.length}</Badge>}
                    {scenario.expectedMedications.length > 0 && <Badge tone="teal">Medicamentos: {scenario.expectedMedications.length}</Badge>}
                  </div>
                </Section>
              </div>
            ) },
            { key: "scoring", label: "Mapa de campos y puntuación", content: (
              <Section title="C/D. Mapa de campos + puntuación de automatización" testId="section-field-map" actions={
                <div className="flex gap-2">
                  <Button size="sm" variant="subtle" onClick={autoPartial} data-testid="miracle-autofill-partial"><Wand2 className="h-4 w-4" /> Simular parcial</Button>
                  <Button size="sm" onClick={autoPerfect} data-testid="miracle-autofill-perfect"><Wand2 className="h-4 w-4" /> Simular perfecto</Button>
                </div>
              }>
                <div className="mb-3 flex flex-wrap gap-3 text-2xs">
                  <Badge tone="green">Correctos: {metrics.correct}</Badge>
                  <Badge tone="red">Incorrectos: {metrics.incorrect}</Badge>
                  <Badge tone="amber">Sección incorrecta: {metrics.wrongSection}</Badge>
                  <Badge tone="neutral">Faltantes: {metrics.missing}</Badge>
                  <Badge tone="blue">Llenados: {metrics.filled}/{metrics.total}</Badge>
                </div>
                <div className="overflow-x-auto rounded-lg border border-ink-200">
                  <table className="w-full text-sm" data-testid="miracle-field-map-table">
                    <thead><tr className="border-b border-ink-200 bg-ink-50 text-left text-2xs uppercase text-ink-500"><th className="px-3 py-2">Campo</th><th className="px-3 py-2">data-testid</th><th className="px-3 py-2">Sección</th><th className="px-3 py-2">Valor actual (Miracle)</th><th className="px-3 py-2">Esperado</th><th className="px-3 py-2">Estado</th></tr></thead>
                    <tbody>
                      {scenario.expectedFields.map((f) => {
                        const status = scoreField(f.expected, fills[f.key]);
                        return (
                          <tr key={f.key} className="border-b border-ink-100" data-testid={`field-map-row-${f.key}`}>
                            <td className="px-3 py-1.5 text-ink-700">{f.label}</td>
                            <td className="px-3 py-1.5"><code className="text-2xs text-clinical-600">{f.testId ?? "—"}</code></td>
                            <td className="px-3 py-1.5 text-2xs text-ink-400">{f.section}</td>
                            <td className="px-3 py-1.5"><input aria-label={`Valor actual ${f.label}`} data-testid={`fill-${f.key}`} value={fills[f.key]?.value ?? ""} onChange={(e) => setFill(f.key, e.target.value)} className="field-input h-7 py-0.5 text-xs" /></td>
                            <td className="px-3 py-1.5 text-2xs text-ink-500">{f.expected}</td>
                            <td className="px-3 py-1.5"><Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Section>
            ) },
            { key: "live", label: "Campos en vivo", badge: <Badge tone="neutral">{liveFields.length}</Badge>, content: (
              <Section title="Registro de campos visibles (en vivo)" testId="section-live-fields" description="Refleja los campos montados en la pantalla actual. Abra un módulo y vuelva, o use el overlay Miracle (Ctrl+Shift+M) dentro del módulo destino.">
                {liveFields.length === 0 ? <p className="text-sm text-ink-400">No hay campos registrados en esta ruta. Abra un módulo clínico para poblar el registro.</p> : (
                  <div className="overflow-x-auto rounded-lg border border-ink-200">
                    <table className="w-full text-sm"><thead><tr className="border-b border-ink-200 bg-ink-50 text-left text-2xs uppercase text-ink-500"><th className="px-3 py-2">Etiqueta</th><th className="px-3 py-2">data-testid</th><th className="px-3 py-2">Sección</th><th className="px-3 py-2">Ruta</th><th className="px-3 py-2">Valor</th><th className="px-3 py-2"></th></tr></thead>
                      <tbody>{liveFields.slice(0, 100).map((f) => (
                        <tr key={f.testId} className="border-b border-ink-100"><td className="px-3 py-1.5 text-ink-700">{f.label}</td><td className="px-3 py-1.5"><code className="text-2xs text-clinical-600">{f.testId}</code></td><td className="px-3 py-1.5 text-2xs text-ink-400">{f.section}</td><td className="px-3 py-1.5 text-2xs text-ink-400">{f.route}</td><td className="px-3 py-1.5 text-2xs text-ink-600">{f.value || "—"}</td><td className="px-3 py-1.5"><button onClick={() => copy(f.testId)} aria-label="Copiar testid" className="text-ink-400 hover:text-clinical-600"><Copy className="h-3.5 w-3.5" /></button></td></tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
              </Section>
            ) },
            { key: "stress", label: "Prueba de estrés", content: (
              <Section title="F. Modo de prueba de estrés — etiquetas duplicadas" testId="section-stress-test" description="Las mismas etiquetas aparecen en varios módulos. Miracle debe entender el contexto, no solo coincidir el texto.">
                <div className="space-y-4">
                  {STRESS_TEST_LABELS.map((group) => (
                    <div key={group.label}>
                      <h5 className="mb-1.5 text-sm font-semibold text-ink-800">“{group.label}”</h5>
                      <div className="overflow-x-auto rounded-lg border border-ink-200">
                        <table className="w-full text-sm"><thead><tr className="border-b border-ink-200 bg-ink-50 text-left text-2xs uppercase text-ink-500"><th className="px-3 py-2">Contexto</th><th className="px-3 py-2">Ruta</th><th className="px-3 py-2">data-testid</th></tr></thead>
                          <tbody>{group.places.map((p) => (
                            <tr key={p.testId} className="border-b border-ink-100"><td className="px-3 py-1.5 text-ink-700">{p.context}</td><td className="px-3 py-1.5 text-2xs text-ink-400">{p.route}</td><td className="px-3 py-1.5"><code className="text-2xs text-clinical-600">{p.testId}</code></td></tr>
                          ))}</tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            ) },
          ]} />
        </div>
      </div>
    </PageContainer>
  );
}

function DifficultyBadge({ d }: { d: MiracleScenario["difficulty"] }) {
  const map = { basic: { tone: "green", label: "Básico" }, intermediate: { tone: "amber", label: "Intermedio" }, advanced: { tone: "red", label: "Avanzado" } } as const;
  return <Badge tone={map[d].tone}>{map[d].label}</Badge>;
}
